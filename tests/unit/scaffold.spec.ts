import { describe, expect, it } from 'vitest';
import {
    WORKFLOW_ID,
    WORKFLOW_PACKAGE_NAME,
    createScaffoldFiles,
    parseWorkflowOpencode,
    readScaffoldAsset,
    scaffold,
    toWorkflowId,
} from '../../src/scaffold/index.js';

describe('scaffold contract', () => {
    it('publishes package and workflow metadata', () => {
        expect(scaffold.packageName.length).toBeGreaterThan(0);
        expect(scaffold.workflow.length).toBeGreaterThan(0);
        expect(scaffold.packageName).toBe(WORKFLOW_PACKAGE_NAME);
        expect(scaffold.workflow).toBe(WORKFLOW_ID);
    });

    it('strips package scopes when deriving workflow ids', () => {
        expect(toWorkflowId('@org/coding')).toBe('coding');
        expect(toWorkflowId('langgraph-ts-template')).toBe('langgraph-ts-template');
    });

    it('creates only graph and opencode scaffold files', () => {
        const files = createScaffoldFiles();
        const cfg = parseWorkflowOpencode(JSON.parse(files['opencode.json']));

        expect(Object.keys(files).sort()).toEqual(['graph.ts', 'opencode.json']);
        expect(files['graph.ts']).toContain(`import { createGraph } from '${scaffold.packageName}';`);
        expect(files['graph.ts']).toContain(`createGraph({ workflow: '${scaffold.workflow}' })`);
        expect(cfg.default_agent).toBe('planner');
        expect(cfg.agent.planner.mode).toBe('primary');
        expect(cfg.agent.manager.mode).toBe('primary');
        expect(cfg.agent.coder.hidden).toBe(true);
        expect(cfg.command.execute.agent).toBe('manager');
        expect(cfg.command.execute.subtask).toBe(true);
    });

    it('reads the raw opencode scaffold asset', () => {
        expect(readScaffoldAsset('opencode')).toContain('"default_agent": "planner"');
        expect(readScaffoldAsset('opencode')).toContain('"manager"');
    });
});
