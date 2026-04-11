export interface AgentComposition {
    snippets: string[];
}
export interface TemplateComposition {
    globalSnippets: string[];
    agents: Record<string, AgentComposition>;
}
export declare const PROMPT_BREAK = "\n\n";
export declare const resolveSnippets: (cfg: TemplateComposition, agent: string) => string[];
export declare const joinPrompt: (parts: string[]) => string;
