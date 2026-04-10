/**
 * Starter LangGraph.js Template
 * Make this code your own!
 */
import { StateGraph } from '@langchain/langgraph';
import { StateAnnotation } from './state.js';
const DEFAULT_GRAPH_NAME = 'New Agent';
/**
 * Define a node, these do the work of the graph and should have most of the logic.
 * Must return a subset of the properties set in StateAnnotation.
 * @param state The current state of the graph.
 * @param config Extra parameters passed into the state graph.
 * @returns Some subset of parameters of the graph state, used to update the state
 * for the edges and nodes executed next.
 */
const callModel = async (_state, _config) => {
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
export const route = (state) => {
    if (state.messages.length > 0) {
        return '__end__';
    }
    // Loop back
    return 'callModel';
};
export const createGraph = (cfg = {}) => {
    const graph = new StateGraph(StateAnnotation)
        .addNode('callModel', callModel)
        .addEdge('__start__', 'callModel')
        .addConditionalEdges('callModel', route)
        .compile();
    graph.name = cfg.name ?? DEFAULT_GRAPH_NAME;
    return graph;
};
export const graph = createGraph();
