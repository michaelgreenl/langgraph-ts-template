export interface OpenVikingScanResult {
    readonly ignored: readonly string[];
}

export const DEFAULT_IGNORED_EXTENSIONS = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.pdf',
    '.zip',
] as const satisfies readonly string[];
