export type TemplateVars = Record<string, unknown>;

export interface TemplateEngine {
    compose(agent: string, vars?: TemplateVars): Promise<string>;
}
