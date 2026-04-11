import { describe, expect, it } from 'vitest';
import { createGraph, graph } from '../../src/index.js';

describe('Public API', () => {
    it('creates a compiled graph', async () => {
        const app = createGraph({ name: 'Docs Agent' });

        const result = await app.invoke({ messages: ['Hello'] });

        expect(app.name).toBe('Docs Agent');
        expect(result.messages.length).toBeGreaterThan(0);
    });

    it('exports a default graph instance', () => {
        expect(graph).toBeDefined();
    });
});
