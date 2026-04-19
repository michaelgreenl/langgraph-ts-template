import { z } from 'zod';
export type WorkflowConfig = {
    prompts?: {
        global?: readonly string[];
        agents?: Readonly<Record<string, readonly string[]>>;
    };
};
export type ResolvedWorkflowConfig = {
    prompts: {
        global: readonly string[];
        agents: Readonly<Record<string, readonly string[]>>;
    };
};
export declare const workflowConfigSchema: z.ZodObject<{
    prompts: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        global: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
        agents: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const parseWorkflowConfig: (value: unknown) => WorkflowConfig;
export declare const DEFAULT_WORKFLOW_CONFIG: ResolvedWorkflowConfig;
export declare const loadWorkflowConfig: (path: string) => Promise<WorkflowConfig>;
export declare const resolveWorkflowConfig: (value?: WorkflowConfig) => ResolvedWorkflowConfig;
