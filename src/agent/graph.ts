/**
 * Starter LangGraph.js Template
 * Make this code your own!
 */
import { BaseMessage, SystemMessage } from '@langchain/core/messages';
import { StateGraph } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createConfig, loadConfig, type MawConfig } from '../config.js';
import { createTemplateEngine, type TemplateVars } from '../templates/engine.js';
import { MAW_SYSTEM_ID, StateAnnotation } from './state.js';

const DEFAULT_GRAPH_NAME = 'New Agent';
const DEFAULT_CONFIG_FILE = '.maw/config.json';

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

    const file = resolve(root, cfg.configPath ?? DEFAULT_CONFIG_FILE);

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

/**
 * Define a node, these do the work of the graph and should have most of the logic.
 * Must return a subset of the properties set in StateAnnotation.
 * @param state The current state of the graph.
 * @param config Extra parameters passed into the state graph.
 * @returns Some subset of parameters of the graph state, used to update the state
 * for the edges and nodes executed next.
 */
const callModel = async (
    _state: typeof StateAnnotation.State,
    _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> => {
    /**
     * Do some work... (e.g. call an LLM)
     * For example, with LangChain you could do something like:
     *
     * ```bash
     * $ npm i @langchain/anthropic
     * ```
     *
     * ```ts
     * import { ChatAnthropic } from "@langchain/anthropic";
     * const model = new ChatAnthropic({
     *   model: "claude-3-5-sonnet-20240620",
     *   apiKey: process.env.ANTHROPIC_API_KEY,
     * });
     * const res = await model.invoke(state.messages);
     * ```
     *
     * Or, with an SDK directly:
     *
     * ```bash
     * $ npm i openai
     * ```
     *
     * ```ts
     * import OpenAI from "openai";
     * const openai = new OpenAI({
     *   apiKey: process.env.OPENAI_API_KEY,
     * });
     *
     * const chatCompletion = await openai.chat.completions.create({
     *   messages: [{
     *     role: state.messages[0]._getType(),
     *     content: state.messages[0].content,
     *   }],
     *   model: "gpt-4o-mini",
     * });
     * ```
     */
    return {
        messages: [
            {
                role: 'assistant',
                content: `Hi there! How are you?`,
            },
        ],
    };
};

/**
 * Routing function: Determines whether to continue research or end the builder.
 * This function decides if the gathered information is satisfactory or if more research is needed.
 *
 * @param state - The current state of the research builder
 * @returns Either "callModel" to continue research or END to finish the builder
 */
export const route = (state: typeof StateAnnotation.State): '__end__' | 'callModel' => {
    if (state.messages.length > 0) {
        return '__end__';
    }

    // Loop back
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
