export interface OpenVikingFindInput {
    readonly query: string;
    readonly targetUri: string;
}
export interface OpenVikingFindResult {
    readonly content: string;
}
export interface OpenVikingClient {
    find(input: OpenVikingFindInput): Promise<OpenVikingFindResult[]>;
}
