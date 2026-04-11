export const PROMPT_BREAK = '\n\n';
const normalize = (text) => text.replace(/\r\n/g, '\n').trim();
export const resolveSnippets = (cfg, agent) => {
    const entry = cfg.agents[agent];
    if (!entry) {
        throw new Error(`Unknown prompt agent: ${agent}`);
    }
    return [...cfg.globalSnippets, ...entry.snippets];
};
export const joinPrompt = (parts) => parts.map(normalize).join(PROMPT_BREAK);
