import type { BaseMessage, BaseMessageLike } from '@langchain/core/messages';
export declare const MAW_SYSTEM_ID = "maw-system";
export declare const StateAnnotation: import("@langchain/langgraph").AnnotationRoot<{
    messages: import("@langchain/langgraph").BaseChannel<BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], BaseMessageLike[] | import("@langchain/langgraph").OverwriteValue<BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>, unknown>;
    plannerPrompt: import("@langchain/langgraph").BaseChannel<string, string | import("@langchain/langgraph").OverwriteValue<string>, unknown>;
    coderPrompt: import("@langchain/langgraph").BaseChannel<string, string | import("@langchain/langgraph").OverwriteValue<string>, unknown>;
    handoff: import("@langchain/langgraph").BaseChannel<string, string | import("@langchain/langgraph").OverwriteValue<string>, unknown>;
}>;
export type GraphState = typeof StateAnnotation.State;
export type GraphUpdate = typeof StateAnnotation.Update;
