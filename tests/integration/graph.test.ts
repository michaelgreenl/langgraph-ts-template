import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkflowConfig } from '../../src/config.js';

const calls: string[] = [];

const firstPrompt = (input: unknown): string => {
    if (!Array.isArray(input)) {
        return '';
    }

    const [first] = input;

    if (!first || typeof first !== 'object' || !('content' in first)) {
        return '';
    }

    return String(first.content);
};

vi.mock('@langchain/openai', async () => {
    const { AIMessage } = await import('@langchain/core/messages');

    return {
        ChatOpenAI: class {
            constructor(_opts: unknown) {}

            async invoke(input: unknown) {
                calls.push(firstPrompt(input));

                if (calls.length % 2 === 1) {
                    return new AIMessage({
                        content: 'Planner handoff from stub.',
                    });
                }

                return new AIMessage({
                    content: 'Coder response from stub.',
                });
            }
        },
    };
});

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
    calls.splice(0);
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('Graph', () => {
    it('runs planner then coder, captures live prompts, and stores a non-empty handoff', async () => {
        const root = await createRoot();
        const cfg = {
            root,
            workflowConfig: {
                prompts: {
                    agents: {
                        planner: ['research-rules'],
                        coder: ['typescript'],
                    },
                },
            } satisfies WorkflowConfig,
        };

        const { createGraph } = await import('../../src/agent/graph.js');
        const app = createGraph(cfg);
        const result = await app.invoke({ messages: ['Hello'] });

        expect(calls).toHaveLength(2);
        expect(result.plannerPrompt).toContain(GENERAL);
        expect(result.plannerPrompt).toContain(SECURITY);
        expect(result.plannerPrompt).toContain(RESEARCH);
        expect(result.coderPrompt).toContain(GENERAL);
        expect(result.coderPrompt).toContain(SECURITY);
        expect(result.coderPrompt).toContain(TYPESCRIPT);
        expect(result.handoff).toBe('Planner handoff from stub.');
        expect(result.handoff).not.toHaveLength(0);
        expect(calls[0]).toBe(result.plannerPrompt);
        expect(calls[1]).toBe(result.coderPrompt);
        expect(text(result.messages.at(-1)?.content)).toBe('Coder response from stub.');
    });

    it('injects workspacePath and custom snippets into planner and coder prompts', async () => {
        const root = await createRoot();

        await writeProject(root);
        await writeFile(join(root, '.maw/templates/runtime-note.njk'), 'Workspace path: {{ workspacePath }}\n');
        await writeFile(join(root, '.maw/templates/planner-note.njk'), 'Planner snippet active.\n');
        await writeFile(join(root, '.maw/templates/coder-note.njk'), 'Coder snippet active.\nPlanner handoff: {{ handoff }}\n');
        await writeWorkflow(root, 'runtime-note', {
            prompts: {
                global: ['general', 'runtime-note'],
                agents: {
                    planner: ['planner-note'],
                    coder: ['coder-note'],
                },
            },
        });

        const { createGraph } = await import('../../src/agent/graph.js');
        const app = createGraph({ root, workflow: 'runtime-note', vars: { workspacePath: '/ignored' } });
        const result = await app.invoke({ messages: ['Hello'] });

        expect(result.plannerPrompt).toContain('Workspace path: .');
        expect(result.plannerPrompt).toContain('Planner snippet active.');
        expect(result.coderPrompt).toContain('Workspace path: .');
        expect(result.coderPrompt).toContain('Coder snippet active.');
        expect(result.coderPrompt).toContain('Planner handoff: Planner handoff from stub.');
        expect(result.handoff).toBe('Planner handoff from stub.');
    });

    it('falls back to embedded defaults when the workflow config file is missing', async () => {
        const root = await createRoot();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const { createGraph } = await import('../../src/agent/graph.js');
        const app = createGraph({ root, workflow: 'missing' });
        const result = await app.invoke({ messages: ['Hello'] });

        expect(result.plannerPrompt).toContain(GENERAL);
        expect(result.plannerPrompt).toContain(SECURITY);
        expect(result.plannerPrompt).toContain(RESEARCH);
        expect(result.coderPrompt).toContain(GENERAL);
        expect(result.coderPrompt).toContain(SECURITY);
        expect(result.coderPrompt).toContain(TYPESCRIPT);
        expect(warn).not.toHaveBeenCalled();
    });

    it('warns and falls back when the workflow config file is invalid', async () => {
        const root = await createRoot();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await writeProject(root);
        await writeWorkflow(root, 'broken', '{"prompts":');

        const { createGraph } = await import('../../src/agent/graph.js');
        const app = createGraph({ root, workflow: 'broken' });
        const result = await app.invoke({ messages: ['Hello'] });

        expect(result.plannerPrompt).toContain(GENERAL);
        expect(result.plannerPrompt).toContain(SECURITY);
        expect(result.plannerPrompt).toContain(RESEARCH);
        expect(result.coderPrompt).toContain(TYPESCRIPT);
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

        const { createGraph } = await import('../../src/agent/graph.js');
        const app = createGraph({ root, workflow: 'missing-snippet' });
        const result = await app.invoke({ messages: ['Hello'] });

        expect(result.plannerPrompt).toContain(GENERAL);
        expect(result.plannerPrompt).toContain(SECURITY);
        expect(result.plannerPrompt).toContain(RESEARCH);
        expect(result.coderPrompt).toContain(TYPESCRIPT);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0]?.[0]).toContain('Unable to resolve snippet: missing-snippet');
        expect(warn.mock.calls[0]?.[0]).toContain('agent coder');
    });

    it('rejects when an existing maw.json file is invalid', async () => {
        const root = await createRoot();

        await writeFile(join(root, 'maw.json'), '{"workspace":');

        const { createGraph } = await import('../../src/agent/graph.js');
        await expect(createGraph({ root, workflow: 'missing' }).invoke({ messages: ['Hello'] })).rejects.toThrow(
            'Invalid maw.json',
        );
    });
});
