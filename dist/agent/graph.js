import { SystemMessage } from '@langchain/core/messages';
import { StateGraph } from '@langchain/langgraph';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DEFAULT_CONFIG_PATH, createConfig, loadConfig } from '../config.js';
import { createTemplateEngine } from '../templates/engine.js';
import { MAW_SYSTEM_ID, StateAnnotation } from './state.js';
const DEFAULT_GRAPH_NAME = 'New Agent';
const fileExists = async (file) => {
    try {
        await access(file);
        return true;
    }
    catch {
        return false;
    }
};
const loadRuntime = async (cfg) => {
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
const isPrompt = (message, prompt) => {
    if (!message || message._getType() !== 'system') {
        return false;
    }
    return message.id === MAW_SYSTEM_ID || String(message.content) === prompt;
};
const prompt = async (cfg) => {
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
const ensurePrompt = (cached) => {
    return async (state) => {
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
const callModel = async (_state, _config) => {
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
export const route = (state) => {
    if (state.messages.length > 0) {
        return '__end__';
    }
    return 'callModel';
};
export const createGraph = (cfg = {}) => {
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
