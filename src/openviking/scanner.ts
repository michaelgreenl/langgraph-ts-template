import type { OpenVikingScope } from './config.js';

export interface OpenVikingScanInput {
    readonly scope: OpenVikingScope;
    readonly target: string;
}

export interface OpenVikingScanResult {
    readonly ignored: readonly string[];
    readonly scope: OpenVikingScope;
}

export const DEFAULT_OPENVIKING_IGNORED_EXTENSIONS = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.pdf',
    '.zip',
] as const satisfies readonly string[];
