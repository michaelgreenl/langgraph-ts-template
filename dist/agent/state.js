import { Annotation, messagesStateReducer } from '@langchain/langgraph';
export const MAW_SYSTEM_ID = 'maw-system';
// Keep the generated system prompt pinned at the front of the message list.
const pinSystem = (messages) => {
    const index = messages.findIndex((message) => message.id === MAW_SYSTEM_ID);
    if (index < 0) {
        return messages;
    }
    const system = messages[index];
    if (!system) {
        return messages;
    }
    return [system, ...messages.slice(0, index), ...messages.slice(index + 1)];
};
const text = () => Annotation({
    reducer: (_left, right) => right,
    default: () => '',
});
export const StateAnnotation = Annotation.Root({
    messages: Annotation({
        reducer: (left, right) => pinSystem(messagesStateReducer(left, right)),
        default: () => [],
    }),
    plannerPrompt: text(),
    coderPrompt: text(),
    handoff: text(),
});
