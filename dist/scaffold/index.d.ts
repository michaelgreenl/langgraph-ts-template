declare const assetFiles: {
    readonly config: "config.json";
    readonly graph: "graph.ts.template";
};
export type ScaffoldAssetName = keyof typeof assetFiles;
export declare const toWorkflowId: (name: string) => string;
export declare const WORKFLOW_PACKAGE_NAME: string;
export declare const WORKFLOW_ID: string;
export declare const templateDir: string;
export declare const scaffold: {
    packageName: string;
    workflow: string;
};
export declare const readScaffoldAsset: (name: ScaffoldAssetName) => string;
export declare const createScaffoldFiles: () => Record<"graph.ts" | "config.json", string>;
export {};
