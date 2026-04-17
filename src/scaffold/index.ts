import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const packagePath = fileURLToPath(new URL('../../package.json', import.meta.url));
const graphToken = '__WORKFLOW_PACKAGE__';

const assetFiles = {
    config: 'config.json',
    ov: 'ov.conf',
    graph: 'graph.ts.template',
    langgraph: 'langgraph.json.template',
} as const;

const resolveAsset = (file: string): string => {
    const paths = [
        fileURLToPath(new URL(`./assets/${file}`, import.meta.url)),
        fileURLToPath(new URL(`../../src/scaffold/assets/${file}`, import.meta.url)),
    ];

    for (const path of paths) {
        if (existsSync(path)) {
            return path;
        }
    }

    throw new Error(`Unable to locate scaffold asset: ${file}`);
};

const pkg: unknown = JSON.parse(readFileSync(packagePath, 'utf8'));

if (
    typeof pkg !== 'object' ||
    pkg === null ||
    !('name' in pkg) ||
    typeof pkg.name !== 'string' ||
    pkg.name.length === 0
) {
    throw new Error('Unable to determine the installed workflow package name.');
}

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

export const WORKFLOW_PACKAGE_NAME = pkg.name;

export const SCAFFOLD_DIRECTORIES = ['.maw/templates'] as const;

export const SCAFFOLD_GITIGNORE = ['.maw/config.json', '.maw/ov.conf', '.maw/openviking/'] as const;

export const SCAFFOLD_RULES: ScaffoldRules = {
    overwrite: 'preserve',
    gitignoreMerge: 'append-once',
};

export const scaffold: MawScaffold = {
    packageName: WORKFLOW_PACKAGE_NAME,
    directories: SCAFFOLD_DIRECTORIES,
    assets: {
        config: {
            source: resolveAsset(assetFiles.config),
            target: '.maw/config.json',
        },
        ov: {
            source: resolveAsset(assetFiles.ov),
            target: '.maw/ov.conf',
        },
        graph: {
            source: resolveAsset(assetFiles.graph),
            target: '.maw/graph.ts',
        },
        // LangGraph deployment commands read these keys directly from langgraph.json.
        langgraph: {
            source: resolveAsset(assetFiles.langgraph),
            target: 'langgraph.json',
        },
    },
    gitignore: SCAFFOLD_GITIGNORE,
    rules: SCAFFOLD_RULES,
};

export const readScaffoldAsset = (name: ScaffoldAssetName): string =>
    readFileSync(scaffold.assets[name].source, 'utf8');

export const createScaffoldFiles = (name = scaffold.packageName): Record<string, string> => ({
    [scaffold.assets.config.target]: readScaffoldAsset('config'),
    [scaffold.assets.ov.target]: readScaffoldAsset('ov'),
    [scaffold.assets.graph.target]: readScaffoldAsset('graph').replace(graphToken, name),
    [scaffold.assets.langgraph.target]: readScaffoldAsset('langgraph'),
});
