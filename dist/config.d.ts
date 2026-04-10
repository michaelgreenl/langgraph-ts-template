import { z } from 'zod';
export declare const mawConfigSchema: z.ZodObject<{
    workspace: z.ZodString;
    graph: z.ZodObject<{
        name: z.ZodString;
    }, z.core.$strip>;
    openviking: z.ZodObject<{
        enabled: z.ZodBoolean;
        host: z.ZodString;
        port: z.ZodNumber;
    }, z.core.$strip>;
    llm: z.ZodObject<{
        provider: z.ZodString;
        apiKey: z.ZodString;
    }, z.core.$strip>;
    templates: z.ZodObject<{
        sources: z.ZodArray<z.ZodEnum<{
            custom: "custom";
            embedded: "embedded";
            git: "git";
        }>>;
        customPath: z.ZodString;
        gitRepos: z.ZodArray<z.ZodString>;
        globalSnippets: z.ZodArray<z.ZodString>;
        agents: z.ZodRecord<z.ZodString, z.ZodObject<{
            snippets: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type MawConfig = z.infer<typeof mawConfigSchema>;
export declare const DEFAULT_CONFIG_PATH = ".maw/config.json";
export declare const createConfig: () => MawConfig;
export declare const resolveEnvVars: <T>(value: T, env?: NodeJS.ProcessEnv) => T;
export declare const parseConfig: (value: unknown) => MawConfig;
export declare const loadConfig: (file?: string, env?: NodeJS.ProcessEnv) => Promise<MawConfig>;
