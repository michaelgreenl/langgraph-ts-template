export interface TemplateComposition {
    readonly global: readonly string[];
    readonly agents: Readonly<Record<string, readonly string[]>>;
}

export const PROMPT_BREAK = '\n\n';

const normalize = (text: string): string => text.replace(/\r\n/g, '\n').trim();

export const resolveSnippets = (cfg: TemplateComposition, agent: string): string[] => {
    const snippets = cfg.agents[agent];

    if (!snippets) {
        throw new Error(`Unknown prompt agent: ${agent}`);
    }

    return [...cfg.global, ...snippets];
};

export const joinPrompt = (parts: readonly string[]): string => parts.map(normalize).join(PROMPT_BREAK);
