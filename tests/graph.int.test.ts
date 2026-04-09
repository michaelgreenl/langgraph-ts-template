import { describe, expect, it } from 'vitest';
import { graph } from '../src/agent/graph.js';

describe('Graph', () => {
    it('should process input through the graph', async () => {
        const input = 'What is the capital of France?';
        const result = await graph.invoke({ messages: [input] });

        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.messages).toBeDefined();
        expect(Array.isArray(result.messages)).toBe(true);
        expect(result.messages.length).toBeGreaterThan(0);

        const lastMessage = result.messages[result.messages.length - 1];
        expect(lastMessage.content.toString().toLowerCase()).toContain('hi');
    }, 30_000);
});
