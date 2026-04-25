import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { loadWorkflowOpencode, parseWorkflowOpencode, workflowOpencodeSchema } from '../../src/scaffold/index.js';

const dirs: string[] = [];
const plannerPermission = {
    edit: 'allow',
    task: {
        explore: 'allow',
        general: 'allow',
    },
} as const;
const managerPermission = {
    edit: 'allow',
    bash: 'allow',
    task: {
        '*': 'deny',
        coder: 'allow',
        explore: 'allow',
        general: 'allow',
    },
} as const;
const coderPermission = {
    edit: 'allow',
    bash: 'allow',
} as const;
const command = {
    execute: {
        agent: 'manager',
        subtask: true,
        template:
            'The active planner session is approved for execution. Continue as the manager, use the existing conversation as context, and execute the user request below according to the packaged manager contract.\n\nUser execute request:\n$ARGUMENTS',
    },
} as const;

const createDir = async (): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), 'maw-workflow-config-'));
    dirs.push(dir);
    return dir;
};

afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('workflow config', () => {
    it('accepts the required planner-manager-coder topology', () => {
        expect(
            workflowOpencodeSchema.parse({
                $schema: 'https://opencode.ai/config.json',
                default_agent: 'planner',
                command,
                agent: {
                    planner: {
                        mode: 'primary',
                        permission: plannerPermission,
                        prompt: 'plan',
                    },
                    manager: {
                        mode: 'primary',
                        permission: managerPermission,
                        prompt: 'manage',
                    },
                    coder: {
                        mode: 'subagent',
                        hidden: true,
                        permission: coderPermission,
                        prompt: 'code',
                    },
                },
            }),
        ).toMatchObject({
            default_agent: 'planner',
            command: {
                execute: {
                    agent: 'manager',
                    subtask: true,
                },
            },
            agent: {
                planner: {
                    mode: 'primary',
                },
                manager: {
                    mode: 'primary',
                },
                coder: {
                    hidden: true,
                    mode: 'subagent',
                },
            },
        });
    });

    it('rejects invalid workflow topology', () => {
        expect(() => parseWorkflowOpencode({ default_agent: 'manager', command, agent: {} })).toThrow();
        expect(() =>
            parseWorkflowOpencode({
                default_agent: 'planner',
                command,
                agent: {
                    planner: {
                        mode: 'primary',
                        permission: plannerPermission,
                        prompt: 'plan',
                    },
                    manager: {
                        mode: 'primary',
                        hidden: true,
                        permission: managerPermission,
                        prompt: 'manage',
                    },
                    coder: {
                        mode: 'subagent',
                        hidden: true,
                        permission: coderPermission,
                        prompt: 'code',
                    },
                },
            }),
        ).toThrow();
        expect(() =>
            parseWorkflowOpencode({
                default_agent: 'planner',
                command,
                agent: {
                    planner: {
                        mode: 'primary',
                        permission: plannerPermission,
                        prompt: 'plan',
                    },
                    manager: {
                        mode: 'primary',
                        permission: managerPermission,
                        prompt: 'manage',
                    },
                    coder: {
                        mode: 'subagent',
                        permission: coderPermission,
                        prompt: 'code',
                    },
                },
            }),
        ).toThrow();
    });

    it('loads opencode config from disk', async () => {
        const dir = await createDir();
        const file = join(dir, 'opencode.json');

        await writeFile(
            file,
            JSON.stringify({
                default_agent: 'planner',
                command,
                agent: {
                    planner: {
                        mode: 'primary',
                        permission: plannerPermission,
                        prompt: 'plan',
                    },
                    manager: {
                        mode: 'primary',
                        permission: managerPermission,
                        prompt: 'manage',
                    },
                    coder: {
                        mode: 'subagent',
                        hidden: true,
                        permission: coderPermission,
                        prompt: 'code',
                    },
                },
            }),
        );

        await expect(loadWorkflowOpencode(file)).resolves.toMatchObject({
            default_agent: 'planner',
            command: {
                execute: {
                    agent: 'manager',
                    subtask: true,
                },
            },
            agent: {
                planner: {
                    mode: 'primary',
                },
                manager: {
                    mode: 'primary',
                },
                coder: {
                    hidden: true,
                },
            },
        });
    });
});
