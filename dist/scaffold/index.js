import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { readAgentMeta, readAsset, readPrompt } from './assets.js';
const packagePath = fileURLToPath(new URL('../../package.json', import.meta.url));
const packageToken = '__WORKFLOW_PACKAGE__';
const workflowToken = '__WORKFLOW_ID__';
const promptTokens = {
    coder: '__CODER_PROMPT__',
    manager: '__MANAGER_PROMPT__',
    planner: '__PLANNER_PROMPT__',
};
const assetFiles = {
    graph: 'graph.ts.template',
    opencode: 'opencode.json',
};
const agents = ['planner', 'manager', 'coder'];
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
if (typeof pkg !== 'object' ||
    pkg === null ||
    !('name' in pkg) ||
    typeof pkg.name !== 'string' ||
    pkg.name.length === 0) {
    throw new Error('Unable to determine the installed workflow package name.');
}
export const toWorkflowId = (name) => name.replace(/^@[^/]+\//, '');
const baseline = {
    planner: readAgentMeta('planner'),
    manager: readAgentMeta('manager'),
    coder: readAgentMeta('coder'),
};
const tree = z.lazy(() => z.union([z.string(), z.boolean(), z.record(z.string(), tree)]));
const permission = z.record(z.string(), tree).optional();
const agent = z
    .object({
    hidden: z.boolean().optional(),
    mode: z.string(),
    permission,
    prompt: z.string().min(1),
})
    .passthrough();
const execute = z
    .object({
    agent: z.literal('manager'),
    subtask: z.literal(false),
    template: z.string().min(1),
})
    .passthrough();
export const workflowOpencodeSchema = z
    .object({
    $schema: z.string().min(1).optional(),
    default_agent: z.literal('planner'),
    command: z
        .object({
        execute,
    })
        .passthrough(),
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
const escape = (name) => JSON.stringify(readPrompt(name)).slice(1, -1);
const renderOpencode = () => {
    let text = readAsset('opencode');
    for (const name of Object.keys(promptTokens)) {
        text = text.replaceAll(promptTokens[name], escape(name));
    }
    return text;
};
export const WORKFLOW_PACKAGE_NAME = pkg.name;
export const WORKFLOW_ID = toWorkflowId(WORKFLOW_PACKAGE_NAME);
export const scaffold = {
    packageName: WORKFLOW_PACKAGE_NAME,
    workflow: WORKFLOW_ID,
};
export const parseWorkflowOpencode = (value) => workflowOpencodeSchema.parse(value);
export const loadWorkflowOpencode = async (path) => {
    const text = await readFile(path, 'utf8');
    const value = JSON.parse(text);
    return parseWorkflowOpencode(value);
};
export const readScaffoldAsset = (name) => {
    if (name === 'opencode') {
        return renderOpencode();
    }
    return readAsset(name);
};
export const createScaffoldFiles = () => ({
    'opencode.json': readScaffoldAsset('opencode'),
    'graph.ts': readScaffoldAsset('graph')
        .replace(packageToken, WORKFLOW_PACKAGE_NAME)
        .replace(workflowToken, WORKFLOW_ID),
});
