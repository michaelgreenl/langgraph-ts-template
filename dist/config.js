import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { readAsset } from './scaffold/assets.js';
const snippets = z.array(z.string().min(1));
export const workflowConfigSchema = z
    .object({
    prompts: z
        .object({
        global: snippets.optional(),
        agents: z.record(z.string().min(1), snippets).optional(),
    })
        .partial()
        .optional(),
})
    .partial();
const mergeList = (base, next) => {
    if (!next || next.length === 0) {
        return [...base];
    }
    return [...next];
};
const mergeAgents = (base, next) => {
    const agents = {};
    const names = new Set([...Object.keys(next ?? {}), ...Object.keys(base)]);
    for (const name of names) {
        agents[name] = mergeList(base[name] ?? [], next?.[name]);
    }
    return agents;
};
export const parseWorkflowConfig = (value) => workflowConfigSchema.parse(value);
const loadDefaultWorkflowConfig = () => {
    const cfg = parseWorkflowConfig(JSON.parse(readAsset('config')));
    return {
        prompts: {
            global: mergeList([], cfg.prompts?.global),
            agents: mergeAgents({}, cfg.prompts?.agents),
        },
    };
};
export const DEFAULT_WORKFLOW_CONFIG = loadDefaultWorkflowConfig();
export const loadWorkflowConfig = async (path) => {
    const text = await readFile(path, 'utf8');
    const value = JSON.parse(text);
    return parseWorkflowConfig(value);
};
export const resolveWorkflowConfig = (value) => {
    const cfg = value ? parseWorkflowConfig(value) : undefined;
    return {
        prompts: {
            global: mergeList(DEFAULT_WORKFLOW_CONFIG.prompts.global, cfg?.prompts?.global),
            agents: mergeAgents(DEFAULT_WORKFLOW_CONFIG.prompts.agents, cfg?.prompts?.agents),
        },
    };
};
