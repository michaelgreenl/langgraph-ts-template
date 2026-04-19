export const PROMPT_BREAK = '\n\n';
const normalize = (text) => text.replace(/\r\n/g, '\n').trim();
export const resolveSnippets = (cfg, agent) => {
    const snippets = cfg.agents[agent];
    if (!snippets) {
        throw new Error(`Unknown prompt agent: ${agent}`);
    }
    return [...cfg.global, ...snippets];
};
export const joinPrompt = (parts) => parts.map(normalize).join(PROMPT_BREAK);
