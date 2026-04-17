export interface AgentComposition {
    readonly snippets: readonly string[];
}

export interface TemplateComposition {
    readonly globalSnippets: readonly string[];
    readonly agents: Readonly<Record<string, AgentComposition>>;
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

export const joinPrompt = (parts: readonly string[]): string => parts.map(normalize).join(PROMPT_BREAK);
