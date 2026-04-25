import { describe, expect, it } from 'vitest';
import { parseWorkflowOpencode, readScaffoldAsset } from '../../src/scaffold/index.js';

describe('opencode prompts', () => {
    it('materializes packaged planner, manager, and coder instructions into the scaffold asset', () => {
        const cfg = parseWorkflowOpencode(JSON.parse(readScaffoldAsset('opencode')));

        expect(cfg.agent.planner.prompt).toContain('### Planning Mode');
        expect(cfg.agent.manager.prompt).toContain('### 1. Dispatch the Coder');
        expect(cfg.agent.coder.prompt).toContain('Follow test-driven development for all implementation tasks.');
        expect(cfg.agent.planner.prompt).not.toContain('__PLANNER_PROMPT__');
        expect(cfg.agent.manager.prompt).not.toContain('__MANAGER_PROMPT__');
        expect(cfg.agent.coder.prompt).not.toContain('__CODER_PROMPT__');
    });
});
