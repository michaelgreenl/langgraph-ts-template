export interface TemplateComposition {
    readonly global: readonly string[];
    readonly agents: Readonly<Record<string, readonly string[]>>;
}
export declare const PROMPT_BREAK = "\n\n";
export declare const resolveSnippets: (cfg: TemplateComposition, agent: string) => string[];
export declare const joinPrompt: (parts: readonly string[]) => string;
