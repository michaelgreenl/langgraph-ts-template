import type { MawConfig } from '../config.js';
export type TemplateVars = Record<string, unknown>;
export interface TemplateEngine {
    compose(agent: string, vars?: TemplateVars): Promise<string>;
}
export interface CreateTemplateEngineOptions {
    config: MawConfig;
    root?: string;
    strict?: boolean;
}
export declare const createTemplateEngine: (opts: CreateTemplateEngineOptions) => TemplateEngine;
