import { beforeEach, describe, expect, it, vi } from 'vitest';

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
                    return new AIMessage({ content: 'Planner handoff from agent stub.' });
                }

                return new AIMessage({ content: 'Coder response from agent stub.' });
            }
        },
    };
});

import { createGraph, route } from '../../src/agent/graph.js';

describe('agent runtime', () => {
    beforeEach(() => {
        calls.splice(0);
    });

    it('uses packaged opencode prompts without requiring workflow-local template files', async () => {
        const app = createGraph();
        const result = await app.invoke({ messages: ['Hello'] });

        expect(calls).toHaveLength(2);
        expect(result.plannerPrompt).toContain('You are the **Planner**');
        expect(result.coderPrompt).toContain('You are the **Coder**');
        expect(result.coderPrompt).toContain('Planner handoff:\nPlanner handoff from agent stub.');
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
