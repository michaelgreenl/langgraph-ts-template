import { existsSync } from 'node:fs';
import { access, readdir, readFile } from 'node:fs/promises';
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
const sourceError = (dir) => new Error(`Missing template source directory: ${dir}`);
const repoDirs = async (root, strict) => {
    const dir = resolve(root, '.maw/template-repos');
    if (!(await fileExists(dir))) {
        if (strict) {
            throw sourceError(dir);
        }
        return [];
    }
    const dirs = await readdir(dir, { withFileTypes: true });
    return dirs
        .filter((entry) => entry.isDirectory())
        .map((entry) => resolve(dir, entry.name))
        .sort((left, right) => left.localeCompare(right));
};
const sources = async ({ config, root = process.cwd(), strict = true, }) => {
    const dirs = [];
    if (config.templates.sources.includes('custom')) {
        const dir = resolve(root, config.templates.customPath);
        if (!(await fileExists(dir))) {
            if (strict) {
                throw sourceError(dir);
            }
        }
        else {
            dirs.push({ dir, type: 'custom' });
        }
    }
    if (config.templates.sources.includes('git')) {
        for (const dir of await repoDirs(root, strict)) {
            dirs.push({ dir, type: 'git' });
        }
    }
    if (config.templates.sources.includes('embedded')) {
        dirs.push({ dir: defaultDir(), type: 'embedded' });
    }
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
const message = (err) => {
    if (!err || typeof err !== 'object' || !('message' in err) || typeof err.message !== 'string') {
        return String(err);
    }
    return err.message;
};
const render = async (env, file, name, vars) => {
    const text = await readFile(file, 'utf8');
    try {
        return env.renderString(text, vars);
    }
    catch (err) {
        throw new Error(`Unable to render snippet ${name}: ${message(err)}`);
    }
};
export const createTemplateEngine = (opts) => {
    const env = new nunjucks.Environment(undefined, {
        autoescape: false,
        throwOnUndefined: true,
    });
    let dirs;
    const load = () => {
        dirs ??= sources(opts);
        return dirs;
    };
    return {
        compose: async (agent, vars = {}) => {
            const names = resolveSnippets(opts.config.templates, agent);
            const bag = {
                workspacePath: opts.config.workspace,
                ...vars,
            };
            const roots = await load();
            const parts = await Promise.all(names.map(async (name) => render(env, await resolveSnippet(name, roots), name, bag)));
            return joinPrompt(parts);
        },
    };
};
