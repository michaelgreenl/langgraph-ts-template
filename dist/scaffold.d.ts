declare const assetFiles: {
    readonly config: "config.json";
    readonly ov: "ov.conf";
    readonly graph: "graph.ts.template";
};
export type ScaffoldAssetName = keyof typeof assetFiles;
export interface ScaffoldAsset {
    source: string;
    target: string;
}
export interface ScaffoldRules {
    overwrite: 'preserve';
    gitignoreMerge: 'append-once';
}
export interface MawScaffold {
    packageName: string;
    directories: readonly string[];
    assets: Record<ScaffoldAssetName, ScaffoldAsset>;
    gitignore: readonly string[];
    rules: ScaffoldRules;
}
export declare const WORKFLOW_PACKAGE_NAME: string;
export declare const SCAFFOLD_DIRECTORIES: readonly [".maw/templates"];
export declare const SCAFFOLD_GITIGNORE: readonly [".maw/config.json", ".maw/ov.conf"];
export declare const SCAFFOLD_RULES: ScaffoldRules;
export declare const scaffold: MawScaffold;
export declare const readScaffoldAsset: (name: ScaffoldAssetName) => string;
export declare const createScaffoldFiles: (name?: string) => Record<string, string>;
export {};
