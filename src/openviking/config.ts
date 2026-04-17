export interface OpenVikingConfig {
    readonly host: string;
    readonly port: number;
}

export const DEFAULT_OPENVIKING_CONFIG = {
    host: 'localhost',
    port: 1933,
} as const satisfies OpenVikingConfig;
