import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const packagePath = fileURLToPath(new URL('../../package.json', import.meta.url));
const packageToken = '__WORKFLOW_PACKAGE__';
const workflowToken = '__WORKFLOW_ID__';

const assetFiles = {
    config: 'config.json',
    graph: 'graph.ts.template',
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

export const toWorkflowId = (name: string): string => name.replace(/^@[^/]+\//, '');

const resolveTemplateDir = (): string => {
    const local = fileURLToPath(new URL('../templates/defaults', import.meta.url));

    if (existsSync(local)) {
        return local;
    }

    return fileURLToPath(new URL('../../src/templates/defaults', import.meta.url));
};

export const WORKFLOW_PACKAGE_NAME = pkg.name;
export const WORKFLOW_ID = toWorkflowId(WORKFLOW_PACKAGE_NAME);
export const templateDir = resolveTemplateDir();

export const scaffold: { packageName: string; workflow: string } = {
    packageName: WORKFLOW_PACKAGE_NAME,
    workflow: WORKFLOW_ID,
};

export const readScaffoldAsset = (name: ScaffoldAssetName): string =>
    readFileSync(resolveAsset(assetFiles[name]), 'utf8');

export const createScaffoldFiles = (): Record<'graph.ts' | 'config.json', string> => ({
    'config.json': readScaffoldAsset('config'),
    'graph.ts': readScaffoldAsset('graph')
        .replace(packageToken, WORKFLOW_PACKAGE_NAME)
        .replace(workflowToken, WORKFLOW_ID),
});
