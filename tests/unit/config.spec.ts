import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import {
    DEFAULT_WORKFLOW_CONFIG,
    loadWorkflowConfig,
    parseWorkflowConfig,
    resolveWorkflowConfig,
    workflowConfigSchema,
} from '../../src/config.js';

const dirs: string[] = [];

const createDir = async (): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), 'maw-workflow-config-'));
    dirs.push(dir);
    return dir;
};

afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('workflow config', () => {
    it('accepts empty and partial config objects', () => {
        expect(workflowConfigSchema.parse({})).toEqual({});
        expect(
            workflowConfigSchema.parse({
                prompts: {
                    global: ['general'],
                    agents: {
                        coder: [],
                    },
                },
            }),
        ).toEqual({
            prompts: {
                global: ['general'],
                agents: {
                    coder: [],
                },
            },
        });
    });

    it('throws on invalid config values', () => {
        expect(() => parseWorkflowConfig({ prompts: 'bad' })).toThrow();
        expect(() => parseWorkflowConfig({ prompts: { global: [1] } })).toThrow();
        expect(() => parseWorkflowConfig({ prompts: { agents: { coder: ['typescript', 1] } } })).toThrow();
    });

    it('loads partial config from disk', async () => {
        const dir = await createDir();
        const file = join(dir, 'config.json');

        await writeFile(
            file,
            JSON.stringify({
                prompts: {
                    agents: {
                        coder: ['typescript'],
                    },
                },
            }),
        );

        await expect(loadWorkflowConfig(file)).resolves.toEqual({
            prompts: {
                agents: {
                    coder: ['typescript'],
                },
            },
        });
    });

    it('deep-merges overrides into defaults', () => {
        const cfg = resolveWorkflowConfig({
            prompts: {
                global: ['security'],
                agents: {
                    coder: ['typescript', 'security'],
                },
            },
        });

        expect(cfg.prompts.global).toEqual(['security']);
        expect(cfg.prompts.agents.planner).toEqual(DEFAULT_WORKFLOW_CONFIG.prompts.agents.planner);
        expect(cfg.prompts.agents.coder).toEqual(['typescript', 'security']);
    });

    it('treats explicit empty arrays as inherited defaults', () => {
        const cfg = resolveWorkflowConfig({
            prompts: {
                global: [],
                agents: {
                    planner: [],
                    coder: [],
                },
            },
        });

        expect(cfg.prompts.global).toEqual(DEFAULT_WORKFLOW_CONFIG.prompts.global);
        expect(cfg.prompts.agents.planner).toEqual(DEFAULT_WORKFLOW_CONFIG.prompts.agents.planner);
        expect(cfg.prompts.agents.coder).toEqual(DEFAULT_WORKFLOW_CONFIG.prompts.agents.coder);
    });

    it('publishes non-empty embedded defaults', () => {
        expect(DEFAULT_WORKFLOW_CONFIG.prompts.global.length).toBeGreaterThan(0);
        expect(DEFAULT_WORKFLOW_CONFIG.prompts.agents.planner.length).toBeGreaterThan(0);
        expect(DEFAULT_WORKFLOW_CONFIG.prompts.agents.coder.length).toBeGreaterThan(0);
    });
});
