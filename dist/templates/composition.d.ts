export interface AgentComposition {
    readonly snippets: readonly string[];
}
export interface TemplateComposition {
    readonly globalSnippets: readonly string[];
    readonly agents: Readonly<Record<string, AgentComposition>>;
}
export declare const PROMPT_BREAK = "\n\n";
export declare const resolveSnippets: (cfg: TemplateComposition, agent: string) => string[];
export declare const joinPrompt: (parts: readonly string[]) => string;
