import { StateAnnotation } from './state.js';
export interface GraphConfig {
    name?: string;
}
/**
 * Routing function: Determines whether to continue research or end the builder.
 * This function decides if the gathered information is satisfactory or if more research is needed.
 *
 * @param state - The current state of the research builder
 * @returns Either "callModel" to continue research or END to finish the builder
 */
export declare const route: (state: typeof StateAnnotation.State) => "__end__" | "callModel";
export declare const createGraph: (cfg?: GraphConfig) => import("@langchain/langgraph").CompiledStateGraph<{
    messages: import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[];
}, {
    messages?: import("@langchain/core/messages").BaseMessageLike[] | import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]> | undefined;
}, "callModel" | "__start__", {
    messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/core/messages").BaseMessageLike[] | import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>, unknown>;
}, {
    messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/core/messages").BaseMessageLike[] | import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>, unknown>;
}, import("@langchain/langgraph").StateDefinition, {
    callModel: import("@langchain/langgraph").UpdateType<{
        messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/core/messages").BaseMessageLike[] | import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>, unknown>;
    }>;
}, unknown, unknown>;
export declare const graph: import("@langchain/langgraph").CompiledStateGraph<{
    messages: import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[];
}, {
    messages?: import("@langchain/core/messages").BaseMessageLike[] | import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]> | undefined;
}, "callModel" | "__start__", {
    messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/core/messages").BaseMessageLike[] | import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>, unknown>;
}, {
    messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/core/messages").BaseMessageLike[] | import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>, unknown>;
}, import("@langchain/langgraph").StateDefinition, {
    callModel: import("@langchain/langgraph").UpdateType<{
        messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/core/messages").BaseMessageLike[] | import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>, unknown>;
    }>;
}, unknown, unknown>;
