import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGraph } from '../../src/agent/graph.js';

const roots: string[] = [];

const makeConfig = () => ({
    workspace: '.',
    graph: {
        name: 'agent',
        agent: 'researcher',
    },
    openviking: {
        enabled: false,
        host: 'localhost',
        port: 1933,
    },
    llm: {
        provider: 'openai',
        apiKey: 'sk-test',
    },
    templates: {
        sources: ['embedded', 'custom'] as const,
        customPath: '.maw/templates',
        gitRepos: [],
        globalSnippets: ['general', 'security'],
        agents: {
            researcher: {
                snippets: ['research-rules', 'python'],
            },
            coder: {
                snippets: ['typescript'],
            },
        },
    },
});

const createRoot = async (): Promise<string> => {
    const root = await mkdtemp(join(tmpdir(), 'maw-graph-'));
    roots.push(root);
    await mkdir(join(root, '.maw/templates'), { recursive: true });
    return root;
};

const text = (value: unknown): string => String(value);

afterEach(async () => {
    vi.unstubAllEnvs();
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('Graph', () => {
    it('injects one leading system message and preserves it across turns', async () => {
        const root = await createRoot();
        const cfg = {
            config: makeConfig(),
            root,
        };

        await writeFile(join(root, '.maw/templates/general.njk'), 'override general\n');

        const app = createGraph(cfg);
        const first = await app.invoke({ messages: ['Hello'] });

        expect(first.messages[0]._getType()).toBe('system');

        const prompt = text(first.messages[0].content);
        expect(prompt).toContain('override general');
        expect(prompt.indexOf('override general')).toBeLessThan(prompt.indexOf('Never inspect secrets'));
        expect(prompt.indexOf('Never inspect secrets')).toBeLessThan(prompt.indexOf('Verify claims against repository evidence'));
        expect(prompt.indexOf('Verify claims against repository evidence')).toBeLessThan(
            prompt.indexOf('Prefer clear Python'),
        );

        const second = await app.invoke({
            messages: [...first.messages, 'Second turn'],
        });

        expect(second.messages[0]._getType()).toBe('system');
        expect(second.messages.filter((message) => message._getType() === 'system')).toHaveLength(1);
        expect(text(second.messages[0].content)).toBe(prompt);
    });

    it('loads maw config from disk and selects the configured agent profile', async () => {
        const root = await createRoot();
        const cfg = makeConfig();

        vi.stubEnv('OPENAI_API_KEY', 'sk-live');
        cfg.graph.agent = 'coder';
        cfg.llm.apiKey = '${OPENAI_API_KEY}';

        await writeFile(join(root, '.maw/config.json'), JSON.stringify(cfg, null, 4));

        const app = createGraph({ root });
        const result = await app.invoke({ messages: ['Hello'] });
        const prompt = text(result.messages[0].content);

        expect(result.messages[0]._getType()).toBe('system');
        expect(prompt).toContain(
            'Prefer TypeScript with explicit types, narrow public APIs, and small composable functions.',
        );
        expect(prompt).not.toContain(
            'Prefer clear Python with standard library primitives, explicit errors, and small functions.',
        );
    }, 30_000);
});
