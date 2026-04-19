import { SystemMessage, type BaseMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';
import { StateGraph } from '@langchain/langgraph';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import {
    DEFAULT_WORKFLOW_CONFIG,
    loadWorkflowConfig,
    resolveWorkflowConfig,
    type ResolvedWorkflowConfig,
    type WorkflowConfig,
} from '../config.js';
import { createTemplateEngine, type TemplateVars } from '../templates/engine.js';
import { MAW_SYSTEM_ID, StateAnnotation } from './state.js';

const DEFAULT_GRAPH_NAME = 'New Agent';

interface ProjectConfig {
    workspace: string;
    templates: {
        customPath: string;
    };
}

const projectConfigSchema = z
    .object({
        workspace: z.string().min(1),
        templates: z
            .object({
                customPath: z.string().min(1),
            })
            .passthrough(),
    })
    .passthrough();

const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
    workspace: '.',
    templates: {
        customPath: '.maw/templates',
    },
};

export interface GraphConfig {
    agent?: string;
    workflowConfig?: WorkflowConfig;
    workflow?: string;
    name?: string;
    root?: string;
    vars?: TemplateVars;
}

const fileExists = async (file: string): Promise<boolean> => {
    try {
        await access(file);
        return true;
    } catch {
        return false;
    }
};

const message = (err: unknown): string =>
    err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' ? err.message : String(err);

const loadProjectConfig = async (root: string): Promise<ProjectConfig> => {
    const file = resolve(root, 'maw.json');

    if (!(await fileExists(file))) {
        return DEFAULT_PROJECT_CONFIG;
    }

    try {
        const text = await readFile(file, 'utf8');
        const value: unknown = JSON.parse(text);

        return projectConfigSchema.parse(value);
    } catch (err) {
        throw new Error(`Invalid maw.json at ${file}: ${message(err)}`);
    }
};

const loadRuntime = async (
    cfg: GraphConfig,
): Promise<{ agent: string; projectConfig: ProjectConfig; root: string; workflowConfig: ResolvedWorkflowConfig }> => {
    const root = cfg.root ?? process.cwd();
    const projectConfig = await loadProjectConfig(root);
    let workflowConfig = DEFAULT_WORKFLOW_CONFIG;

    if (cfg.workflowConfig) {
        workflowConfig = resolveWorkflowConfig(cfg.workflowConfig);
    } else if (cfg.workflow) {
        const file = resolve(root, '.maw/graphs', cfg.workflow, 'config.json');

        if (await fileExists(file)) {
            try {
                workflowConfig = resolveWorkflowConfig(await loadWorkflowConfig(file));
            } catch (err) {
                console.warn(
                    `[langgraph-ts-template] Invalid workflow config at ${file}; falling back to embedded defaults. ${message(err)}`,
                );
            }
        }
    }

    const agent = cfg.agent ?? Object.keys(workflowConfig.prompts.agents)[0];

    if (!agent) {
        throw new Error('No prompt agents configured.');
    }

    return {
        agent,
        projectConfig,
        root,
        workflowConfig,
    };
};

const isPrompt = (message: BaseMessage | undefined, prompt: string): boolean => {
    if (!message || message._getType() !== 'system') {
        return false;
    }

    return message.id === MAW_SYSTEM_ID || String(message.content) === prompt;
};

const prompt = async (cfg: GraphConfig): Promise<string> => {
    const runtime = await loadRuntime(cfg);
    const opts = {
        prompts: runtime.workflowConfig.prompts,
        workspace: runtime.projectConfig.workspace,
        customPath: runtime.projectConfig.templates.customPath,
        root: runtime.root,
    };

    try {
        return await createTemplateEngine(opts).compose(runtime.agent, cfg.vars);
    } catch (err) {
        const msg = message(err);

        if (runtime.workflowConfig === DEFAULT_WORKFLOW_CONFIG || !msg.startsWith('Unable to resolve snippet:')) {
            throw err;
        }

        console.warn(
            `[langgraph-ts-template] ${msg} Falling back to embedded workflow defaults for agent ${runtime.agent}.`,
        );

        return createTemplateEngine({
            prompts: DEFAULT_WORKFLOW_CONFIG.prompts,
            workspace: runtime.projectConfig.workspace,
            customPath: runtime.projectConfig.templates.customPath,
            root: runtime.root,
        }).compose(runtime.agent, cfg.vars);
    }
};

const ensurePrompt = (cached: Promise<string>) => {
    return async (state: typeof StateAnnotation.State): Promise<typeof StateAnnotation.Update> => {
        const system = await cached;

        if (isPrompt(state.messages[0], system)) {
            return {};
        }

        return {
            messages: [
                new SystemMessage({
                    content: system,
                    id: MAW_SYSTEM_ID,
                }),
            ],
        };
    };
};

const callModel = async (
    _state: typeof StateAnnotation.State,
    _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> => {
    // Starter node until callers wire in a real model.
    return {
        messages: [
            {
                role: 'assistant',
                content: 'Hi there! How are you?',
            },
        ],
    };
};

export const route = (state: typeof StateAnnotation.State): '__end__' | 'callModel' => {
    if (state.messages.length > 0) {
        return '__end__';
    }

    return 'callModel';
};

export const createGraph = (cfg: GraphConfig = {}) => {
    const cached = prompt(cfg);
    const graph = new StateGraph(StateAnnotation)
        .addNode('ensurePrompt', ensurePrompt(cached))
        .addNode('callModel', callModel)
        .addEdge('__start__', 'ensurePrompt')
        .addEdge('ensurePrompt', 'callModel')
        .addConditionalEdges('callModel', route)
        .compile();

    graph.name = cfg.name ?? cfg.workflow ?? DEFAULT_GRAPH_NAME;

    return graph;
};

export const graph = createGraph();
