import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';

const PROJECT_CONFIG_FILE = 'maw.json';

export const DEFAULT_OPENVIKING_ENABLED = true;
export const OPENVIKING_CLIENT_CONFIG_FILE = '.maw/ovcli.conf';
export const OPENVIKING_STORAGE_DIR = '.maw/openviking';

export interface OpenVikingProjectConfig {
    readonly enabled: boolean;
}

export interface OpenVikingScope {
    readonly clientConfig: string;
    readonly projectConfig: string;
    readonly root: string;
    readonly storage: string;
}

export interface OpenVikingClientConfig {
    readonly scope: OpenVikingScope;
    readonly url: URL;
}

export interface OpenVikingRuntimeConfig extends OpenVikingClientConfig {
    readonly enabled: boolean;
}

const projectSchema = z
    .object({
        openviking: z.boolean(),
    })
    .passthrough();

const clientSchema = z
    .object({
        url: z.string().min(1),
    })
    .passthrough();

const exists = async (file: string): Promise<boolean> => {
    try {
        await access(file);
        return true;
    } catch {
        return false;
    }
};

const message = (err: unknown): string =>
    err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' ? err.message : String(err);

export class OpenVikingConfigError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = 'OpenVikingConfigError';
    }
}

export const resolveOpenVikingScope = (root: string): OpenVikingScope => {
    const dir = resolve(root);

    return {
        clientConfig: resolve(dir, OPENVIKING_CLIENT_CONFIG_FILE),
        projectConfig: resolve(dir, PROJECT_CONFIG_FILE),
        root: dir,
        storage: resolve(dir, OPENVIKING_STORAGE_DIR),
    };
};

export const loadOpenVikingProjectConfig = async (root: string): Promise<OpenVikingProjectConfig> => {
    const scope = resolveOpenVikingScope(root);

    if (!(await exists(scope.projectConfig))) {
        return {
            enabled: DEFAULT_OPENVIKING_ENABLED,
        };
    }

    try {
        const text = await readFile(scope.projectConfig, 'utf8');
        const value: unknown = JSON.parse(text);
        const cfg = projectSchema.parse(value);

        return {
            enabled: cfg.openviking,
        };
    } catch (err) {
        throw new Error(`Invalid maw.json at ${scope.projectConfig}: ${message(err)}`);
    }
};

export const loadOpenVikingClientConfig = async (root: string): Promise<OpenVikingClientConfig> => {
    const scope = resolveOpenVikingScope(root);

    if (!(await exists(scope.clientConfig))) {
        throw new OpenVikingConfigError(
            `Missing OpenViking client config at ${scope.clientConfig}. Run maw-cli init or create ${OPENVIKING_CLIENT_CONFIG_FILE}.`,
        );
    }

    try {
        const text = await readFile(scope.clientConfig, 'utf8');
        const value: unknown = JSON.parse(text);
        const cfg = clientSchema.parse(value);
        const url = new URL(cfg.url);

        return {
            scope,
            url,
        };
    } catch (err) {
        throw new OpenVikingConfigError(`Invalid OpenViking client config at ${scope.clientConfig}: ${message(err)}`);
    }
};

export const loadOpenVikingRuntimeConfig = async (root: string): Promise<OpenVikingRuntimeConfig> => {
    const [project, client] = await Promise.all([loadOpenVikingProjectConfig(root), loadOpenVikingClientConfig(root)]);

    return {
        enabled: project.enabled,
        scope: client.scope,
        url: client.url,
    };
};
