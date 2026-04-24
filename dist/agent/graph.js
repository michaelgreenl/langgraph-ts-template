import { SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { StateGraph } from '@langchain/langgraph';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import { DEFAULT_WORKFLOW_CONFIG, loadWorkflowConfig, resolveWorkflowConfig, } from '../config.js';
import { createTemplateEngine } from '../templates/engine.js';
import { MAW_SYSTEM_ID, StateAnnotation } from './state.js';
const DEFAULT_GRAPH_NAME = 'New Agent';
const DEFAULT_MODEL = 'gpt-4.1-mini';
const EMPTY_HANDOFF = 'Planner returned an empty handoff.';
const ROOT_WORKSPACE = '.';
const projectConfigSchema = z
    .object({
    openviking: z.boolean(),
    templates: z
        .object({
        customPath: z.string().min(1),
    })
        .passthrough(),
})
    .passthrough();
const DEFAULT_PROJECT_CONFIG = {
    openviking: true,
    templates: {
        customPath: '.maw/templates',
    },
};
const fileExists = async (file) => {
    try {
        await access(file);
        return true;
    }
    catch {
        return false;
    }
};
const message = (err) => err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' ? err.message : String(err);
const createModel = () => {
    return new ChatOpenAI({ model: DEFAULT_MODEL });
};
const loadProjectConfig = async (root) => {
    const file = resolve(root, 'maw.json');
    if (!(await fileExists(file))) {
        return DEFAULT_PROJECT_CONFIG;
    }
    try {
        const text = await readFile(file, 'utf8');
        const value = JSON.parse(text);
        return projectConfigSchema.parse(value);
    }
    catch (err) {
        throw new Error(`Invalid maw.json at ${file}: ${message(err)}`);
    }
};
const loadRuntime = async (cfg) => {
    const root = cfg.root ?? process.cwd();
    const projectConfig = await loadProjectConfig(root);
    let workflowConfig = DEFAULT_WORKFLOW_CONFIG;
    if (cfg.workflowConfig) {
        workflowConfig = resolveWorkflowConfig(cfg.workflowConfig);
    }
    else if (cfg.workflow) {
        const file = resolve(root, '.maw/graphs', cfg.workflow, 'config.json');
        if (await fileExists(file)) {
            try {
                workflowConfig = resolveWorkflowConfig(await loadWorkflowConfig(file));
            }
            catch (err) {
                console.warn(`[langgraph-ts-template] Invalid workflow config at ${file}; falling back to embedded defaults. ${message(err)}`);
            }
        }
    }
    return {
        projectConfig,
        root,
        workflowConfig,
    };
};
const composePrompt = async (runtime, agent, vars) => {
    const opts = {
        prompts: runtime.workflowConfig.prompts,
        workspace: ROOT_WORKSPACE,
        customPath: runtime.projectConfig.templates.customPath,
        root: runtime.root,
    };
    try {
        return await createTemplateEngine(opts).compose(agent, vars);
    }
    catch (err) {
        const msg = message(err);
        if (runtime.workflowConfig === DEFAULT_WORKFLOW_CONFIG || !msg.startsWith('Unable to resolve snippet:')) {
            throw err;
        }
        console.warn(`[langgraph-ts-template] ${msg} Falling back to embedded workflow defaults for agent ${agent}.`);
        return createTemplateEngine({
            prompts: DEFAULT_WORKFLOW_CONFIG.prompts,
            workspace: ROOT_WORKSPACE,
            customPath: runtime.projectConfig.templates.customPath,
            root: runtime.root,
        }).compose(agent, vars);
    }
};
const withSystem = (prompt, messages) => {
    return [
        new SystemMessage({
            content: prompt,
            id: MAW_SYSTEM_ID,
        }),
        ...messages,
    ];
};
const contentPart = (value) => {
    if (typeof value === 'string') {
        return value;
    }
    if (!value || typeof value !== 'object' || !('text' in value) || typeof value.text !== 'string') {
        return '';
    }
    return value.text;
};
const contentText = (value) => {
    if (typeof value === 'string') {
        return value;
    }
    if (!Array.isArray(value)) {
        return '';
    }
    return value
        .map(contentPart)
        .filter((part) => part.length > 0)
        .join('\n')
        .trim();
};
const handoffText = (message) => {
    const handoff = contentText(message.content).trim();
    if (handoff.length > 0) {
        return handoff;
    }
    return EMPTY_HANDOFF;
};
const plannerNode = (runtime, model, vars) => {
    return async (state, config) => {
        const cfg = await runtime;
        const plannerPrompt = await composePrompt(cfg, 'planner', vars);
        const reply = await model.invoke(withSystem(plannerPrompt, state.messages), config);
        return {
            plannerPrompt,
            handoff: handoffText(reply),
            messages: [reply],
        };
    };
};
const coderNode = (runtime, model, vars) => {
    return async (state, config) => {
        const cfg = await runtime;
        const coderPrompt = await composePrompt(cfg, 'coder', {
            ...vars,
            handoff: state.handoff,
        });
        const reply = await model.invoke(withSystem(coderPrompt, state.messages), config);
        return {
            coderPrompt,
            messages: [reply],
        };
    };
};
export const route = (state) => {
    if (state.messages.length > 0) {
        return '__end__';
    }
    return 'callModel';
};
export const createGraph = (cfg = {}) => {
    const runtime = loadRuntime(cfg);
    const model = createModel();
    const graph = new StateGraph(StateAnnotation)
        .addNode('planner', plannerNode(runtime, model, cfg.vars))
        .addNode('coder', coderNode(runtime, model, cfg.vars))
        .addEdge('__start__', 'planner')
        .addEdge('planner', 'coder')
        .addEdge('coder', '__end__')
        .compile();
    graph.name = cfg.name ?? cfg.workflow ?? DEFAULT_GRAPH_NAME;
    return graph;
};
export const graph = createGraph();
