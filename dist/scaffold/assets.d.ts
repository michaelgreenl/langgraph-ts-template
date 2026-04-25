import { z } from 'zod';
declare const files: {
    readonly config: "config.json";
    readonly graph: "graph.ts.template";
    readonly opencode: "opencode.json";
};
declare const prompts: {
    readonly coder: "coder.md";
    readonly manager: "manager.md";
    readonly planner: "planner.md";
};
type AssetName = keyof typeof files;
export type AgentName = keyof typeof prompts;
type Scalar = string | boolean;
interface Tree {
    readonly [key: string]: Scalar | Tree;
}
type Node = Scalar | Tree;
declare const matterSchema: z.ZodObject<{
    description: z.ZodString;
    hidden: z.ZodOptional<z.ZodBoolean>;
    mode: z.ZodEnum<{
        primary: "primary";
        subagent: "subagent";
    }>;
    permission: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<Node, unknown, z.core.$ZodTypeInternals<Node, unknown>>>>;
    tools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
}, z.core.$strip>;
export type AgentMeta = z.infer<typeof matterSchema>;
export declare const readAsset: (name: AssetName) => string;
export declare const readAgentMeta: (name: AgentName) => AgentMeta;
export declare const readPrompt: (name: AgentName) => string;
export {};
