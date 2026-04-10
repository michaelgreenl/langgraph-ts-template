export interface AgentComposition {
    snippets: string[];
}
export interface TemplateComposition {
    globalSnippets: string[];
    agents: Record<string, AgentComposition>;
}
