import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseWorkflowOpencode, readScaffoldAsset, type WorkflowOpencode } from '../../src/scaffold/index.js';

const calls: string[] = [];
const roots: string[] = [];
const PLANNER = 'You are the **Planner**';
const CODER = 'You are the **Coder**';

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

const createOpencode = (planner: string, coder: string): WorkflowOpencode => {
    const base = parseWorkflowOpencode(JSON.parse(readScaffoldAsset('opencode')));

    return {
        ...base,
        agent: {
            ...base.agent,
            planner: {
                ...base.agent.planner,
                prompt: planner,
            },
            coder: {
                ...base.agent.coder,
                prompt: coder,
            },
        },
    };
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

const createRoot = async (): Promise<string> => {
    const root = await mkdtemp(join(tmpdir(), 'maw-graph-'));
    roots.push(root);
    return root;
};

const writeJson = async (file: string, value: unknown): Promise<void> => {
    await writeFile(file, JSON.stringify(value, null, 4));
};

const writeWorkflow = async (root: string, name: string, value: WorkflowOpencode | string): Promise<void> => {
    const dir = join(root, '.maw/graphs', name);

    await mkdir(dir, { recursive: true });

    if (typeof value === 'string') {
        await writeFile(join(dir, 'opencode.json'), value);
        return;
    }

    await writeJson(join(dir, 'opencode.json'), value);
};

afterEach(async () => {
    vi.restoreAllMocks();
    calls.splice(0);
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('Graph', () => {
    it('loads planner and coder prompts from workflow-local opencode.json', async () => {
        const root = await createRoot();

        await writeWorkflow(root, 'runtime', createOpencode('Planner prompt from disk.', 'Coder prompt from disk.'));

        const { createGraph } = await import('../../src/agent/graph.js');
        const app = createGraph({ root, workflow: 'runtime' });
        const result = await app.invoke({ messages: ['Hello'] });

        expect(calls).toHaveLength(2);
        expect(result.plannerPrompt).toBe('Planner prompt from disk.');
        expect(result.coderPrompt).toContain('Coder prompt from disk.');
        expect(result.coderPrompt).toContain('Planner handoff:\nPlanner handoff from stub.');
        expect(result.handoff).toBe('Planner handoff from stub.');
        expect(calls[0]).toBe(result.plannerPrompt);
        expect(calls[1]).toBe(result.coderPrompt);
    });

    it('uses packaged opencode defaults when the workflow file is missing', async () => {
        const root = await createRoot();

        const { createGraph } = await import('../../src/agent/graph.js');
        const app = createGraph({ root, workflow: 'missing' });
        const result = await app.invoke({ messages: ['Hello'] });

        expect(calls).toHaveLength(2);
        expect(result.plannerPrompt).toContain(PLANNER);
        expect(result.coderPrompt).toContain(CODER);
        expect(result.coderPrompt).toContain('Planner handoff:\nPlanner handoff from stub.');
    });

    it('rejects invalid workflow-local opencode.json files', async () => {
        const root = await createRoot();

        await writeWorkflow(root, 'broken', '{"agent":');

        const { createGraph } = await import('../../src/agent/graph.js');
        await expect(createGraph({ root, workflow: 'broken' }).invoke({ messages: ['Hello'] })).rejects.toThrow(
            'Invalid opencode.json',
        );
    });
});
