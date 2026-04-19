import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseWorkflowConfig } from '../../src/config.js';
import {
    WORKFLOW_ID,
    WORKFLOW_PACKAGE_NAME,
    createScaffoldFiles,
    scaffold,
    templateDir,
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

    it('creates only graph and config scaffold files', () => {
        const files = createScaffoldFiles();
        const cfg = parseWorkflowConfig(JSON.parse(files['config.json']));

        expect(Object.keys(files).sort()).toEqual(['config.json', 'graph.ts']);
        expect(files['graph.ts']).toContain(`import { createGraph } from '${scaffold.packageName}';`);
        expect(files['graph.ts']).toContain(`createGraph({ workflow: '${scaffold.workflow}' })`);
        expect(cfg.prompts?.global?.length ?? 0).toBeGreaterThan(0);
        expect(cfg.prompts?.agents?.planner?.length ?? 0).toBeGreaterThan(0);
        expect(cfg.prompts?.agents?.coder?.length ?? 0).toBeGreaterThan(0);
    });

    it('resolves the embedded template directory', () => {
        expect(existsSync(templateDir)).toBe(true);
        expect(readdirSync(templateDir).some((name) => name.endsWith('.njk'))).toBe(true);
    });
});
