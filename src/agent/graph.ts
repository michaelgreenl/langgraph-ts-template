import { SystemMessage, type BaseMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';
import { StateGraph } from '@langchain/langgraph';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DEFAULT_CONFIG_PATH, createConfig, loadConfig, type MawConfig } from '../config.js';
import { createTemplateEngine, type TemplateVars } from '../templates/engine.js';
import { MAW_SYSTEM_ID, StateAnnotation } from './state.js';

const DEFAULT_GRAPH_NAME = 'New Agent';

export interface GraphConfig {
    agent?: string;
    config?: MawConfig;
    configPath?: string;
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

const loadRuntime = async (
    cfg: GraphConfig,
): Promise<{ agent: string; config: MawConfig; root: string; strict: boolean }> => {
    const root = cfg.root ?? process.cwd();

    if (cfg.config) {
        return {
            agent: cfg.agent ?? cfg.config.graph.agent,
            config: cfg.config,
            root,
            strict: true,
        };
    }

    const file = resolve(root, cfg.configPath ?? DEFAULT_CONFIG_PATH);

    if (await fileExists(file)) {
        const config = await loadConfig(file);

        return {
            agent: cfg.agent ?? config.graph.agent,
            config,
            root,
            strict: true,
        };
    }

    const config = createConfig();

    return {
        agent: cfg.agent ?? config.graph.agent,
        config,
        root,
        strict: false,
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
    const engine = createTemplateEngine({
        config: runtime.config,
        root: runtime.root,
        strict: runtime.strict,
    });

    return engine.compose(runtime.agent, {
        workspacePath: runtime.config.workspace,
        ...cfg.vars,
    });
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

    graph.name = cfg.name ?? cfg.config?.graph.name ?? DEFAULT_GRAPH_NAME;

    return graph;
};

export const graph = createGraph();
