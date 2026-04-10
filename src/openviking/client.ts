export interface OpenVikingFindInput {
    query: string;
    targetUri: string;
}

export interface OpenVikingFindResult {
    content: string;
}

export interface OpenVikingClient {
    find(input: OpenVikingFindInput): Promise<OpenVikingFindResult[]>;
}
