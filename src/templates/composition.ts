export interface AgentComposition {
    snippets: string[];
}

export interface TemplateComposition {
    globalSnippets: string[];
    agents: Record<string, AgentComposition>;
}

export const PROMPT_BREAK = '\n\n';

const normalize = (text: string): string => text.replace(/\r\n/g, '\n').trim();

export const resolveSnippets = (cfg: TemplateComposition, agent: string): string[] => {
    const entry = cfg.agents[agent];

    if (!entry) {
        throw new Error(`Unknown prompt agent: ${agent}`);
    }

    return [...cfg.globalSnippets, ...entry.snippets];
};

export const joinPrompt = (parts: string[]): string => parts.map(normalize).join(PROMPT_BREAK);
