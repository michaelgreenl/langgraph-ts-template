export declare const DEFAULT_OPENVIKING_ENABLED = true;
export declare const OPENVIKING_CLIENT_CONFIG_FILE = ".maw/ovcli.conf";
export declare const OPENVIKING_STORAGE_DIR = ".maw/openviking";
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
export declare class OpenVikingConfigError extends Error {
    constructor(msg: string);
}
export declare const resolveOpenVikingScope: (root: string) => OpenVikingScope;
export declare const loadOpenVikingProjectConfig: (root: string) => Promise<OpenVikingProjectConfig>;
export declare const loadOpenVikingClientConfig: (root: string) => Promise<OpenVikingClientConfig>;
export declare const loadOpenVikingRuntimeConfig: (root: string) => Promise<OpenVikingRuntimeConfig>;
