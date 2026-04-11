import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createTemplateEngine } from '../src/templates/engine.js';

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
        sources: ['embedded', 'custom', 'git'] as const,
        customPath: '.maw/templates',
        gitRepos: [],
        globalSnippets: ['general-coding', 'security', 'project-context'],
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
    const root = await mkdtemp(join(tmpdir(), 'maw-templates-'));
    roots.push(root);
    await mkdir(join(root, '.maw/templates'), { recursive: true });
    return root;
};

afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('template engine', () => {
    it('composes snippets in config order with deterministic source precedence', async () => {
        const root = await createRoot();
        const cfg = makeConfig();

        await mkdir(join(root, '.maw/template-repos/acme'), { recursive: true });
        await writeFile(join(root, '.maw/templates/general-coding.njk'), 'custom general {{ projectType }}\n');
        await writeFile(join(root, '.maw/template-repos/acme/security.njk'), 'repo security\n');

        const engine = createTemplateEngine({ config: cfg, root });

        await expect(
            engine.compose('researcher', {
                projectType: 'bun',
                workspacePath: '/repo',
            }),
        ).resolves.toBe(
            [
                'custom general bun',
                'repo security',
                'Workspace path: /repo',
                'Verify claims against repository evidence and call out assumptions when evidence is incomplete.',
                'Prefer clear Python with standard library primitives, explicit errors, and small functions.',
            ].join('\n\n'),
        );
    });

    it('lets a local override beat repo and embedded snippets with the same name', async () => {
        const root = await createRoot();
        const cfg = makeConfig();

        await mkdir(join(root, '.maw/template-repos/acme'), { recursive: true });
        await writeFile(join(root, '.maw/templates/security.njk'), 'local security\n');
        await writeFile(join(root, '.maw/template-repos/acme/security.njk'), 'repo security\n');

        const engine = createTemplateEngine({ config: cfg, root });
        const prompt = await engine.compose('coder');

        expect(prompt).toContain('local security');
        expect(prompt).not.toContain('repo security');
        expect(prompt).not.toContain('Never inspect secrets');
    });

    it('fails for an unknown agent', async () => {
        const root = await createRoot();
        const engine = createTemplateEngine({ config: makeConfig(), root });

        await expect(engine.compose('missing')).rejects.toThrow('Unknown prompt agent: missing');
    });

    it('fails when a configured snippet cannot be resolved', async () => {
        const root = await createRoot();
        const cfg = makeConfig();

        await mkdir(join(root, '.maw/template-repos/acme'), { recursive: true });
        cfg.templates.agents.researcher.snippets = ['missing-snippet'];

        const engine = createTemplateEngine({ config: cfg, root });

        await expect(engine.compose('researcher')).rejects.toThrow('Unable to resolve snippet: missing-snippet');
    });

    it('fails when an enabled source directory is missing', async () => {
        const root = await mkdtemp(join(tmpdir(), 'maw-templates-missing-'));
        roots.push(root);

        const cfg = makeConfig();
        cfg.templates.sources = ['custom'];

        const engine = createTemplateEngine({ config: cfg, root });

        await expect(engine.compose('researcher')).rejects.toThrow(
            `Missing template source directory: ${join(root, '.maw/templates')}`,
        );
    });
});
