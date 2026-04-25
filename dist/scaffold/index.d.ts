import { z } from 'zod';
declare const assetFiles: {
    readonly graph: "graph.ts.template";
    readonly opencode: "opencode.json";
};
export type ScaffoldAssetName = keyof typeof assetFiles;
export type WorkflowOpencode = z.infer<typeof workflowOpencodeSchema>;
export declare const toWorkflowId: (name: string) => string;
interface Tree {
    readonly [key: string]: string | boolean | Tree;
}
type Node = string | boolean | Tree;
export declare const workflowOpencodeSchema: z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    default_agent: z.ZodLiteral<"planner">;
    command: z.ZodObject<{
        execute: z.ZodObject<{
            agent: z.ZodLiteral<"manager">;
            subtask: z.ZodLiteral<true>;
            template: z.ZodString;
        }, z.core.$loose>;
    }, z.core.$loose>;
    agent: z.ZodObject<{
        planner: z.ZodObject<{
            hidden: z.ZodOptional<z.ZodBoolean>;
            mode: z.ZodString;
            permission: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<Node, unknown, z.core.$ZodTypeInternals<Node, unknown>>>>;
            prompt: z.ZodString;
        }, z.core.$loose>;
        manager: z.ZodObject<{
            hidden: z.ZodOptional<z.ZodBoolean>;
            mode: z.ZodString;
            permission: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<Node, unknown, z.core.$ZodTypeInternals<Node, unknown>>>>;
            prompt: z.ZodString;
        }, z.core.$loose>;
        coder: z.ZodObject<{
            hidden: z.ZodOptional<z.ZodBoolean>;
            mode: z.ZodString;
            permission: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<Node, unknown, z.core.$ZodTypeInternals<Node, unknown>>>>;
            prompt: z.ZodString;
        }, z.core.$loose>;
    }, z.core.$loose>;
}, z.core.$loose>;
export declare const WORKFLOW_PACKAGE_NAME: string;
export declare const WORKFLOW_ID: string;
export declare const scaffold: {
    packageName: string;
    workflow: string;
};
export declare const parseWorkflowOpencode: (value: unknown) => WorkflowOpencode;
export declare const loadWorkflowOpencode: (path: string) => Promise<WorkflowOpencode>;
export declare const readScaffoldAsset: (name: ScaffoldAssetName) => string;
export declare const createScaffoldFiles: () => Record<"graph.ts" | "opencode.json", string>;
export {};
