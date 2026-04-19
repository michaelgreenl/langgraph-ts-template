import { type TemplateComposition } from './composition.js';
export type TemplateVars = Record<string, unknown>;
export interface TemplateEngine {
    compose(agent: string, vars?: TemplateVars): Promise<string>;
}
export interface CreateTemplateEngineOptions {
    prompts: TemplateComposition;
    workspace?: string;
    customPath?: string;
    root?: string;
}
export declare const createTemplateEngine: (opts: CreateTemplateEngineOptions) => TemplateEngine;
