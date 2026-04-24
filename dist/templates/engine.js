import { existsSync } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import nunjucks from 'nunjucks';
import { joinPrompt, resolveSnippets } from './composition.js';
const defaultDir = () => {
    const local = fileURLToPath(new URL('./defaults', import.meta.url));
    if (existsSync(local)) {
        return local;
    }
    return fileURLToPath(new URL('../../src/templates/defaults', import.meta.url));
};
const fileExists = async (file) => {
    try {
        await access(file);
        return true;
    }
    catch {
        return false;
    }
};
const sources = async ({ customPath = '.maw/templates', root = process.cwd(), }) => {
    const dirs = [];
    const dir = resolve(root, customPath);
    if (await fileExists(dir)) {
        dirs.push({ dir, type: 'custom' });
    }
    dirs.push({ dir: defaultDir(), type: 'embedded' });
    return dirs;
};
const resolveSnippet = async (name, dirs) => {
    for (const entry of dirs) {
        const file = resolve(entry.dir, `${name}.njk`);
        if (await fileExists(file)) {
            return file;
        }
    }
    throw new Error(`Unable to resolve snippet: ${name}`);
};
const render = async (env, file, name, vars) => {
    const text = await readFile(file, 'utf8');
    try {
        return env.renderString(text, vars);
    }
    catch (err) {
        const msg = err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
            ? err.message
            : String(err);
        throw new Error(`Unable to render snippet ${name}: ${msg}`);
    }
};
export const createTemplateEngine = (opts) => {
    const env = new nunjucks.Environment(undefined, {
        autoescape: false,
        throwOnUndefined: true,
    });
    let dirs;
    return {
        compose: async (agent, vars = {}) => {
            const names = resolveSnippets(opts.prompts, agent);
            const bag = {
                ...vars,
                workspacePath: opts.workspace ?? '',
            };
            const roots = await (dirs ??= sources(opts));
            const parts = await Promise.all(names.map(async (name) => render(env, await resolveSnippet(name, roots), name, bag)));
            return joinPrompt(parts);
        },
    };
};
