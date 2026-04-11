import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { readScaffoldAsset } from './scaffold.js';
const envPattern = /\$\{(\w+)\}/g;
const agentSchema = z.object({
    snippets: z.array(z.string().min(1)).min(1),
});
export const mawConfigSchema = z.object({
    workspace: z.string().min(1),
    graph: z.object({
        name: z.string().min(1),
        agent: z.string().min(1),
    }),
    openviking: z.object({
        enabled: z.boolean(),
        host: z.string().min(1),
        port: z.number().int().positive(),
    }),
    llm: z.object({
        provider: z.string().min(1),
        apiKey: z.string().min(1),
    }),
    templates: z.object({
        sources: z.array(z.enum(['embedded', 'custom', 'git'])).min(1),
        customPath: z.string().min(1),
        gitRepos: z.array(z.string()),
        globalSnippets: z.array(z.string().min(1)),
        agents: z.record(z.string(), agentSchema),
    }),
});
export const DEFAULT_CONFIG_PATH = '.maw/config.json';
const hostEnv = () => globalThis.process?.['env'] ?? {};
const resolveValue = (value, env) => {
    if (typeof value === 'string') {
        return value.replace(envPattern, (_match, name) => {
            const next = env[name];
            if (next !== undefined) {
                return next;
            }
            throw new Error(`Environment variable ${name} is not set but referenced in .maw/config.json`);
        });
    }
    if (Array.isArray(value)) {
        return value.map((item) => resolveValue(item, env));
    }
    if (!value || typeof value !== 'object') {
        return value;
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveValue(item, env)]));
};
export const createConfig = () => mawConfigSchema.parse(JSON.parse(readScaffoldAsset('config')));
export const resolveEnvVars = (value, env = hostEnv()) => resolveValue(value, env);
export const parseConfig = (value) => mawConfigSchema.parse(value);
export const loadConfig = async (file = DEFAULT_CONFIG_PATH, env = hostEnv()) => {
    const text = await readFile(file, 'utf8');
    const raw = JSON.parse(text);
    return parseConfig(resolveEnvVars(raw, env));
};
