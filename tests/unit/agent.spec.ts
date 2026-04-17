import { describe, expect, it } from 'vitest';
import { route } from '../../src/agent/graph.js';

describe('route', () => {
    it('continues when there are no messages', () => {
        expect(route({ messages: [] })).toBe('callModel');
    });

    it('ends when messages are present', () => {
        expect(route({ messages: ['Hello'] })).toBe('__end__');
    });
});
