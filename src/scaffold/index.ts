import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { readAgentMeta, readAsset, readPrompt, type AgentName } from './assets.js';

const packagePath = fileURLToPath(new URL('../../package.json', import.meta.url));
const packageToken = '__WORKFLOW_PACKAGE__';
const workflowToken = '__WORKFLOW_ID__';
const promptTokens = {
    coder: '__CODER_PROMPT__',
    manager: '__MANAGER_PROMPT__',
    planner: '__PLANNER_PROMPT__',
} as const;

const assetFiles = {
    graph: 'graph.ts.template',
    opencode: 'opencode.json',
} as const;

const agents = ['planner', 'manager', 'coder'] as const satisfies readonly AgentName[];

const pkg: unknown = JSON.parse(readFileSync(packagePath, 'utf8'));

if (
    typeof pkg !== 'object' ||
    pkg === null ||
    !('name' in pkg) ||
    typeof pkg.name !== 'string' ||
    pkg.name.length === 0
) {
    throw new Error('Unable to determine the installed workflow package name.');
}

export type ScaffoldAssetName = keyof typeof assetFiles;
export type WorkflowOpencode = z.infer<typeof workflowOpencodeSchema>;

export const toWorkflowId = (name: string): string => name.replace(/^@[^/]+\//, '');

const baseline = {
    planner: readAgentMeta('planner'),
    manager: readAgentMeta('manager'),
    coder: readAgentMeta('coder'),
} as const satisfies Record<AgentName, ReturnType<typeof readAgentMeta>>;

interface Tree {
    readonly [key: string]: string | boolean | Tree;
}

type Node = string | boolean | Tree;

const tree: z.ZodType<Node> = z.lazy(() => z.union([z.string(), z.boolean(), z.record(z.string(), tree)]));
const permission = z.record(z.string(), tree).optional();
const agent = z
    .object({
        hidden: z.boolean().optional(),
        mode: z.string(),
        permission,
        prompt: z.string().min(1),
    })
    .passthrough();

export const workflowOpencodeSchema = z
    .object({
        $schema: z.string().min(1).optional(),
        default_agent: z.literal('planner'),
        agent: z
            .object({
                planner: agent,
                manager: agent,
                coder: agent,
            })
            .passthrough(),
    })
    .passthrough()
    .superRefine((cfg, ctx) => {
        for (const name of agents) {
            const want = baseline[name];
            const item = cfg.agent[name];

            if (item.mode !== want.mode) {
                ctx.addIssue({
                    code: 'custom',
                    message: `${name} mode must stay ${want.mode}.`,
                    path: ['agent', name, 'mode'],
                });
            }

            if ((item.hidden === true) !== (want.hidden === true)) {
                ctx.addIssue({
                    code: 'custom',
                    message: want.hidden === true ? `${name} must stay hidden.` : `${name} must stay visible.`,
                    path: ['agent', name, 'hidden'],
                });
            }

            if (!isDeepStrictEqual(item.permission ?? {}, want.permission ?? {})) {
                ctx.addIssue({
                    code: 'custom',
                    message: `${name} permission must match the packaged agent baseline.`,
                    path: ['agent', name, 'permission'],
                });
            }
        }
    });

const escape = (name: keyof typeof promptTokens): string => JSON.stringify(readPrompt(name)).slice(1, -1);

const renderOpencode = (): string => {
    let text = readAsset('opencode');

    for (const name of Object.keys(promptTokens) as Array<keyof typeof promptTokens>) {
        text = text.replaceAll(promptTokens[name], escape(name));
    }

    return text;
};

export const WORKFLOW_PACKAGE_NAME = pkg.name;
export const WORKFLOW_ID = toWorkflowId(WORKFLOW_PACKAGE_NAME);

export const scaffold: { packageName: string; workflow: string } = {
    packageName: WORKFLOW_PACKAGE_NAME,
    workflow: WORKFLOW_ID,
};

export const parseWorkflowOpencode = (value: unknown): WorkflowOpencode => workflowOpencodeSchema.parse(value);

export const loadWorkflowOpencode = async (path: string): Promise<WorkflowOpencode> => {
    const text = await readFile(path, 'utf8');
    const value: unknown = JSON.parse(text);

    return parseWorkflowOpencode(value);
};

export const readScaffoldAsset = (name: ScaffoldAssetName): string => {
    if (name === 'opencode') {
        return renderOpencode();
    }

    return readAsset(name);
};

export const createScaffoldFiles = (): Record<'graph.ts' | 'opencode.json', string> => ({
    'opencode.json': readScaffoldAsset('opencode'),
    'graph.ts': readScaffoldAsset('graph')
        .replace(packageToken, WORKFLOW_PACKAGE_NAME)
        .replace(workflowToken, WORKFLOW_ID),
});
