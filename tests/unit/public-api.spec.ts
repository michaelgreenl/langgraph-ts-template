import { describe, expect, it } from 'vitest';
import { createGraph, graph, StateAnnotation } from '../../src/index.js';

describe('Public API', () => {
    it('creates a compiled graph', async () => {
        const app = createGraph({ name: 'Docs Agent' });

        const result = await app.invoke({ messages: ['Hello'] });

        expect(app.name).toBe('Docs Agent');
        expect(result.messages.length).toBeGreaterThan(0);
        expect(result.plannerPrompt).toBe('');
        expect(result.coderPrompt).toBe('');
        expect(result.handoff).toBe('');
    });

    it('exports state channels used by planner/coder runtime', () => {
        const keys = Object.keys(StateAnnotation.spec);

        expect(keys).toEqual(expect.arrayContaining(['messages', 'plannerPrompt', 'coderPrompt', 'handoff']));
    });

    it('exports a default graph instance', () => {
        expect(graph).toBeDefined();
    });
});
