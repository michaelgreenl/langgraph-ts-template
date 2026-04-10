export interface OpenVikingConfig {
    host: string;
    port: number;
}

export const DEFAULT_OPENVIKING_CONFIG: OpenVikingConfig = {
    host: 'localhost',
    port: 1933,
};
