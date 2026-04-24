import { describe, expect, it } from 'vitest';
import { createGraph, route } from '../../src/agent/graph.js';

describe('graph', () => {
    it('keeps planner/coder prompt and handoff fields deterministic', async () => {
        const app = createGraph();

        const result = await app.invoke({ messages: ['Hello'] });

        expect(result.plannerPrompt).toBe('');
        expect(result.coderPrompt).toBe('');
        expect(result.handoff).toBe('');
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
