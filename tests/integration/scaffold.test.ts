import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createScaffoldFiles, loadWorkflowOpencode, parseWorkflowOpencode, scaffold } from '../../src/scaffold/index.js';

const roots: string[] = [];

describe('scaffold handoff', () => {
    afterEach(async () => {
        await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
    });

    it('creates workflow-owned scaffold files and materializes the packaged agent baselines', async () => {
        const root = await mkdtemp(join(tmpdir(), 'maw-scaffold-'));
        roots.push(root);

        expect(scaffold.workflow.length).toBeGreaterThan(0);

        const files = createScaffoldFiles();

        expect(Object.keys(files).sort()).toEqual(['graph.ts', 'opencode.json']);

        await writeFile(join(root, 'graph.ts'), files['graph.ts']);
        await writeFile(join(root, 'opencode.json'), files['opencode.json']);

        expect(await readFile(join(root, 'graph.ts'), 'utf8')).toContain(
            `import { createGraph } from '${scaffold.packageName}';`,
        );
        expect(await readFile(join(root, 'graph.ts'), 'utf8')).toContain(
            `createGraph({ workflow: '${scaffold.workflow}' })`,
        );

        const cfg = await loadWorkflowOpencode(join(root, 'opencode.json'));

        expect(cfg.default_agent).toBe('planner');
        expect(cfg.agent.planner.mode).toBe('primary');
        expect(cfg.agent.manager.mode).toBe('primary');
        expect(cfg.agent.coder.mode).toBe('subagent');
        expect(cfg.agent.coder.hidden).toBe(true);
        expect(cfg.agent.planner).toMatchObject({ model: 'openai/gpt-4o' });
        expect(cfg.agent.manager).toMatchObject({ model: 'openai/gpt-4o' });
        expect(cfg.agent.coder).toMatchObject({ model: 'openai/gpt-4o' });
        expect(cfg.command.execute.agent).toBe('manager');
        expect(cfg.command.execute.subtask).toBe(false);
        expect(cfg.agent.planner.permission).toEqual({
            edit: 'allow',
            task: {
                explore: 'allow',
                general: 'allow',
            },
        });
        expect(cfg.agent.manager.permission).toEqual({
            edit: 'allow',
            bash: 'allow',
            task: {
                '*': 'deny',
                coder: 'allow',
                explore: 'allow',
                general: 'allow',
            },
        });
        expect(cfg.agent.coder.permission).toEqual({
            edit: 'allow',
            bash: 'allow',
        });
        expect(createScaffoldFiles()).toEqual(files);
    });

    it('rejects edited agent permissions that diverge from the packaged baselines', () => {
        const cfg = parseWorkflowOpencode(JSON.parse(createScaffoldFiles()['opencode.json']));
        const broken = {
            ...cfg,
            agent: {
                ...cfg.agent,
                manager: {
                    ...cfg.agent.manager,
                    permission: {
                        edit: 'allow',
                        bash: 'allow',
                        task: {
                            '*': 'deny',
                            coder: 'deny',
                            explore: 'allow',
                            general: 'allow',
                        },
                    },
                },
            },
        };

        expect(() => parseWorkflowOpencode(broken)).toThrow(/manager permission/i);
    });

    it('rejects edited configs that remove the execute handoff command', () => {
        const cfg = parseWorkflowOpencode(JSON.parse(createScaffoldFiles()['opencode.json']));
        const broken = {
            ...cfg,
        };

        delete broken.command;

        expect(() => parseWorkflowOpencode(broken)).toThrow(/command/i);
    });

    it('rejects edited configs that force the execute handoff back into subtask mode', () => {
        const cfg = parseWorkflowOpencode(JSON.parse(createScaffoldFiles()['opencode.json']));

        expect(() =>
            parseWorkflowOpencode({
                ...cfg,
                command: {
                    ...cfg.command,
                    execute: {
                        ...cfg.command.execute,
                        subtask: true,
                    },
                },
            }),
        ).toThrow(/subtask/i);
    });
});
