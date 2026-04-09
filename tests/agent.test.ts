import { describe, expect, it } from 'vitest';
import { route } from '../src/agent/graph.js';
describe('Routers', () => {
    it('Test route', async () => {
        const res = route({ messages: [] });
        expect(res).toEqual('callModel');
    }, 100_000);
});
