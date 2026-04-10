import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const packagePath = fileURLToPath(new URL('../package.json', import.meta.url));
const graphToken = '__WORKFLOW_PACKAGE__';
const assetFiles = {
    config: 'config.json',
    ov: 'ov.conf',
    graph: 'graph.ts.template',
};
const resolveAsset = (file) => {
    const local = fileURLToPath(new URL(`./scaffold/assets/${file}`, import.meta.url));
    if (existsSync(local)) {
        return local;
    }
    const src = fileURLToPath(new URL(`../src/scaffold/assets/${file}`, import.meta.url));
    if (existsSync(src)) {
        return src;
    }
    throw new Error(`Unable to locate scaffold asset: ${file}`);
};
const readPackage = () => {
    const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
    if (typeof pkg.name === 'string' && pkg.name.length > 0) {
        return { name: pkg.name };
    }
    throw new Error('Unable to determine the installed workflow package name.');
};
export const WORKFLOW_PACKAGE_NAME = readPackage().name;
export const SCAFFOLD_DIRECTORIES = ['.maw/templates'];
export const SCAFFOLD_GITIGNORE = ['.maw/config.json', '.maw/ov.conf'];
export const SCAFFOLD_RULES = {
    overwrite: 'preserve',
    gitignoreMerge: 'append-once',
};
export const scaffold = {
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
    },
    gitignore: SCAFFOLD_GITIGNORE,
    rules: SCAFFOLD_RULES,
};
export const readScaffoldAsset = (name) => readFileSync(scaffold.assets[name].source, 'utf8');
export const createScaffoldFiles = (name = scaffold.packageName) => ({
    [scaffold.assets.config.target]: readScaffoldAsset('config'),
    [scaffold.assets.ov.target]: readScaffoldAsset('ov'),
    [scaffold.assets.graph.target]: readScaffoldAsset('graph').replace(graphToken, name),
});
