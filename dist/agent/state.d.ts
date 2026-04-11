import { BaseMessage, BaseMessageLike } from '@langchain/core/messages';
export declare const MAW_SYSTEM_ID = "maw-system";
/**
 * A graph's StateAnnotation defines three main things:
 * 1. The structure of the data to be passed between nodes (which "channels" to read from/write to and their types)
 * 2. Default values for each field
 * 3. Reducers for the state's. Reducers are functions that determine how to apply updates to the state.
 * See [Reducers](https://langchain-ai.github.io/langgraphjs/concepts/low_level/#reducers) for more information.
 */
export declare const StateAnnotation: import("@langchain/langgraph").AnnotationRoot<{
    /**
     * Messages track the primary execution state of the agent.
     *
     * Typically accumulates a pattern of:
     *
     * 1. HumanMessage - user input
     * 2. AIMessage with .tool_calls - agent picking tool(s) to use to collect
     *     information
     * 3. ToolMessage(s) - the responses (or errors) from the executed tools
     *
     *     (... repeat steps 2 and 3 as needed ...)
     * 4. AIMessage without .tool_calls - agent responding in unstructured
     *     format to the user.
     *
     * 5. HumanMessage - user responds with the next conversational turn.
     *
     *     (... repeat steps 2-5 as needed ... )
     *
     * Merges two lists of messages or message-like objects with role and content,
     * updating existing messages by ID.
     *
     * Message-like objects are automatically coerced by `messagesStateReducer` into
     * LangChain message classes. If a message does not have a given id,
     * LangGraph will automatically assign one.
     *
     * By default, this ensures the state is "append-only", unless the
     * new message has the same ID as an existing message.
     *
     * Returns:
     *     A new list of messages with the messages from \`right\` merged into \`left\`.
     *     If a message in \`right\` has the same ID as a message in \`left\`, the
     *     message from \`right\` will replace the message from \`left\`.`
     */
    messages: import("@langchain/langgraph").BaseChannel<BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], BaseMessageLike[] | import("@langchain/langgraph").OverwriteValue<BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>, unknown>;
}>;
