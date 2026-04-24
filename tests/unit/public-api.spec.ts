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
                    return new AIMessage({ content: 'Planner handoff from public-api stub.' });
                }

                return new AIMessage({ content: 'Coder response from public-api stub.' });
            }
        },
    };
});

import { createGraph, graph, StateAnnotation } from '../../src/index.js';

describe('Public API', () => {
    beforeEach(() => {
        calls.splice(0);
    });

    it('creates a compiled graph', async () => {
        const app = createGraph({ name: 'Docs Agent' });

        const result = await app.invoke({ messages: ['Hello'] });

        expect(app.name).toBe('Docs Agent');
        expect(result.messages.length).toBeGreaterThan(0);
        expect(calls).toHaveLength(2);
        expect(result.plannerPrompt).not.toBe('');
        expect(result.coderPrompt).not.toBe('');
        expect(result.handoff).toBe('Planner handoff from public-api stub.');
    });

    it('exports state channels used by planner/coder runtime', () => {
        const keys = Object.keys(StateAnnotation.spec);

        expect(keys).toEqual(expect.arrayContaining(['messages', 'plannerPrompt', 'coderPrompt', 'handoff']));
    });

    it('exports a default graph instance', () => {
        expect(graph).toBeDefined();
    });
});
