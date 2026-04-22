import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGraph } from '../../src/agent/graph.js';
import type { WorkflowConfig } from '../../src/config.js';

const roots: string[] = [];

const GENERAL = 'Favor small, reversible changes and prefer the simplest correct implementation.';
const SECURITY = 'Never inspect secrets or .env files. Prefer environment-variable references for sensitive configuration.';
const RESEARCH = 'Verify claims against repository evidence and call out assumptions when evidence is incomplete.';
const TYPESCRIPT = 'Prefer TypeScript with explicit types, narrow public APIs, and small composable functions.';

const createRoot = async (): Promise<string> => {
    const root = await mkdtemp(join(tmpdir(), 'maw-graph-'));
    roots.push(root);
    await mkdir(join(root, '.maw/templates'), { recursive: true });
    return root;
};

const text = (value: unknown): string => String(value);

const writeJson = async (file: string, value: unknown): Promise<void> => {
    await writeFile(file, JSON.stringify(value, null, 4));
};

const writeProject = async (root: string, openviking = false): Promise<void> => {
    await writeJson(join(root, 'maw.json'), {
        openviking,
        templates: {
            customPath: '.maw/templates',
        },
    });
};

const writeWorkflow = async (root: string, name: string, value: WorkflowConfig | string): Promise<void> => {
    const dir = join(root, '.maw/graphs', name);

    await mkdir(dir, { recursive: true });

    if (typeof value === 'string') {
        await writeFile(join(dir, 'config.json'), value);
        return;
    }

    await writeJson(join(dir, 'config.json'), value);
};

afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('Graph', () => {
    it('injects one leading system message, merges partial workflow overrides, and preserves it across turns', async () => {
        const root = await createRoot();
        const cfg = {
            agent: 'coder',
            root,
            workflowConfig: {
                prompts: {
                    agents: {
                        coder: ['research-rules', 'typescript'],
                    },
                },
            } satisfies WorkflowConfig,
        };

        await writeFile(join(root, '.maw/templates/general.njk'), 'override general\n');

        const app = createGraph(cfg);
        const first = await app.invoke({ messages: ['Hello'] });

        expect(first.messages[0]._getType()).toBe('system');

        const prompt = text(first.messages[0].content);
        expect(prompt).toContain('override general');
        expect(prompt).toContain(SECURITY);
        expect(prompt).toContain(RESEARCH);
        expect(prompt).toContain(TYPESCRIPT);
        expect(prompt.indexOf('override general')).toBeLessThan(prompt.indexOf(SECURITY));
        expect(prompt.indexOf(SECURITY)).toBeLessThan(prompt.indexOf(RESEARCH));
        expect(prompt.indexOf(RESEARCH)).toBeLessThan(prompt.indexOf(TYPESCRIPT));

        const second = await app.invoke({
            messages: [...first.messages, 'Second turn'],
        });

        expect(second.messages[0]._getType()).toBe('system');
        expect(second.messages.filter((message) => message._getType() === 'system')).toHaveLength(1);
        expect(text(second.messages[0].content)).toBe(prompt);
    });

    it('loads maw.json and workflow config from disk', async () => {
        const root = await createRoot();

        await writeProject(root);
        await writeWorkflow(root, 'test-workflow', {
            prompts: {
                agents: {
                    coder: ['typescript'],
                },
            },
        });

        const app = createGraph({ root, workflow: 'test-workflow' });
        const result = await app.invoke({ messages: ['Hello'] });
        const prompt = text(result.messages[0].content);

        expect(result.messages[0]._getType()).toBe('system');
        expect(prompt).toContain(GENERAL);
        expect(prompt).toContain(SECURITY);
        expect(prompt).toContain(TYPESCRIPT);
        expect(prompt).not.toContain(RESEARCH);
    }, 30_000);

    it('derives workspacePath from the MAW scope root for custom templates', async () => {
        const root = await createRoot();

        await writeProject(root);
        await writeFile(join(root, '.maw/templates/workspace-note.njk'), 'Workspace path: {{ workspacePath }}\n');
        await writeWorkflow(root, 'workspace-note', {
            prompts: {
                global: ['workspace-note'],
                agents: {
                    coder: ['typescript'],
                },
            },
        });

        const app = createGraph({ agent: 'coder', root, workflow: 'workspace-note' });
        const result = await app.invoke({ messages: ['Hello'] });
        const prompt = text(result.messages[0].content);

        expect(prompt).toContain('Workspace path: .');
        expect(prompt).toContain(TYPESCRIPT);
    });

    it('falls back to embedded defaults when the workflow config file is missing', async () => {
        const root = await createRoot();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const app = createGraph({ root, workflow: 'missing' });
        const result = await app.invoke({ messages: ['Hello'] });
        const prompt = text(result.messages[0].content);

        expect(prompt).toContain(GENERAL);
        expect(prompt).toContain(SECURITY);
        expect(prompt).toContain(RESEARCH);
        expect(prompt).not.toContain(TYPESCRIPT);
        expect(warn).not.toHaveBeenCalled();
    });

    it('warns and falls back when the workflow config file is invalid', async () => {
        const root = await createRoot();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await writeProject(root);
        await writeWorkflow(root, 'broken', '{"prompts":');

        const app = createGraph({ root, workflow: 'broken' });
        const result = await app.invoke({ messages: ['Hello'] });
        const prompt = text(result.messages[0].content);

        expect(prompt).toContain(GENERAL);
        expect(prompt).toContain(SECURITY);
        expect(prompt).toContain(RESEARCH);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0]?.[0]).toContain('Invalid workflow config');
        expect(warn.mock.calls[0]?.[0]).toContain('falling back to embedded defaults');
    });

    it('warns and falls back when a workflow config references a missing snippet', async () => {
        const root = await createRoot();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await writeProject(root);
        await writeWorkflow(root, 'missing-snippet', {
            prompts: {
                agents: {
                    coder: ['missing-snippet'],
                },
            },
        });

        const app = createGraph({ agent: 'coder', root, workflow: 'missing-snippet' });
        const result = await app.invoke({ messages: ['Hello'] });
        const prompt = text(result.messages[0].content);

        expect(prompt).toContain(GENERAL);
        expect(prompt).toContain(SECURITY);
        expect(prompt).toContain(TYPESCRIPT);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0]?.[0]).toContain('Unable to resolve snippet: missing-snippet');
        expect(warn.mock.calls[0]?.[0]).toContain('Falling back to embedded workflow defaults');
    });

    it('does not require ovcli.conf while retrieval is still deferred', async () => {
        const root = await createRoot();

        await writeProject(root, true);

        const app = createGraph({ root, workflow: 'missing' });
        const result = await app.invoke({ messages: ['Hello'] });
        const prompt = text(result.messages[0].content);

        expect(result.messages[0]._getType()).toBe('system');
        expect(prompt).toContain(GENERAL);
        expect(prompt).toContain(SECURITY);
        expect(prompt).toContain(RESEARCH);
    });

    it('ignores invalid ovcli.conf while retrieval is still deferred', async () => {
        const root = await createRoot();

        await writeProject(root, true);
        await writeJson(join(root, '.maw/ovcli.conf'), { url: ':' });

        const app = createGraph({ root, workflow: 'missing' });
        const result = await app.invoke({ messages: ['Hello'] });
        const prompt = text(result.messages[0].content);

        expect(result.messages[0]._getType()).toBe('system');
        expect(prompt).toContain(GENERAL);
        expect(prompt).toContain(SECURITY);
        expect(prompt).toContain(RESEARCH);
    });

    it('rejects when an existing maw.json file is invalid', async () => {
        const root = await createRoot();

        await writeFile(join(root, 'maw.json'), '{"workspace":');

        await expect(createGraph({ root, workflow: 'missing' }).invoke({ messages: ['Hello'] })).rejects.toThrow(
            'Invalid maw.json',
        );
    });
});
