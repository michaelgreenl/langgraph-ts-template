import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseWorkflowOpencode, readScaffoldAsset } from '../../src/scaffold/index.js';

const calls: string[] = [];

const createOpencode = (planner: string, coder: string) => {
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
                    return new AIMessage({ content: 'Planner handoff from unit stub.' });
                }

                return new AIMessage({ content: 'Coder response from unit stub.' });
            }
        },
    };
});

import { createGraph, route } from '../../src/agent/graph.js';

describe('graph', () => {
    beforeEach(() => {
        calls.splice(0);
    });

    it('uses inline opencode prompts and appends the planner handoff for coder', async () => {
        const app = createGraph({ opencode: createOpencode('Planner system prompt.', 'Coder system prompt.') });

        const result = await app.invoke({ messages: ['Hello'] });

        expect(calls).toHaveLength(2);
        expect(result.plannerPrompt).toBe('Planner system prompt.');
        expect(result.coderPrompt).toContain('Coder system prompt.');
        expect(result.coderPrompt).toContain('Planner handoff:\nPlanner handoff from unit stub.');
        expect(result.handoff).toBe('Planner handoff from unit stub.');
        expect(calls[0]).toBe('Planner system prompt.');
        expect(calls[1]).toBe(result.coderPrompt);
    });
});

describe('route', () => {
    it('continues when there are no messages', () => {
        expect(route({ messages: [] })).toBe('callModel');
    });

    it('ends when messages are present', () => {
        expect(route({ messages: ['Hello'] })).toBe('__end__');
    });
});
