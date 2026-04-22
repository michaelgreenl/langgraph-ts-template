import type { OpenVikingClientConfig } from './config.js';

export interface OpenVikingFindInput {
    readonly query: string;
    readonly targetUri: string;
}

export interface OpenVikingFindResult {
    readonly content: string;
}

export interface OpenVikingClient {
    readonly cfg: OpenVikingClientConfig;

    find(input: OpenVikingFindInput): Promise<readonly OpenVikingFindResult[]>;
}
