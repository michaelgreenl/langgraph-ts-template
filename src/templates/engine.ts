import { existsSync } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import nunjucks from 'nunjucks';
import { joinPrompt, resolveSnippets, type TemplateComposition } from './composition.js';

export type TemplateVars = Record<string, unknown>;

export interface TemplateEngine {
    compose(agent: string, vars?: TemplateVars): Promise<string>;
}

export interface CreateTemplateEngineOptions {
    prompts: TemplateComposition;
    workspace?: string;
    customPath?: string;
    root?: string;
}

interface Source {
    dir: string;
    type: 'custom' | 'embedded';
}

const defaultDir = (): string => {
    const local = fileURLToPath(new URL('./defaults', import.meta.url));

    if (existsSync(local)) {
        return local;
    }

    return fileURLToPath(new URL('../../src/templates/defaults', import.meta.url));
};

const fileExists = async (file: string): Promise<boolean> => {
    try {
        await access(file);
        return true;
    } catch {
        return false;
    }
};

const sources = async ({
    customPath = '.maw/templates',
    root = process.cwd(),
}: CreateTemplateEngineOptions): Promise<Source[]> => {
    const dirs: Source[] = [];
    const dir = resolve(root, customPath);

    if (await fileExists(dir)) {
        dirs.push({ dir, type: 'custom' });
    }

    dirs.push({ dir: defaultDir(), type: 'embedded' });

    return dirs;
};

const resolveSnippet = async (name: string, dirs: Source[]): Promise<string> => {
    for (const entry of dirs) {
        const file = resolve(entry.dir, `${name}.njk`);

        if (await fileExists(file)) {
            return file;
        }
    }

    throw new Error(`Unable to resolve snippet: ${name}`);
};

const render = async (env: nunjucks.Environment, file: string, name: string, vars: TemplateVars): Promise<string> => {
    const text = await readFile(file, 'utf8');

    try {
        return env.renderString(text, vars);
    } catch (err) {
        const msg =
            err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
                ? err.message
                : String(err);

        throw new Error(`Unable to render snippet ${name}: ${msg}`);
    }
};

export const createTemplateEngine = (opts: CreateTemplateEngineOptions): TemplateEngine => {
    const env = new nunjucks.Environment(undefined, {
        autoescape: false,
        throwOnUndefined: true,
    });
    let dirs: Promise<Source[]> | undefined;

    return {
        compose: async (agent, vars = {}) => {
            const names = resolveSnippets(opts.prompts, agent);
            const bag = {
                ...vars,
                workspacePath: opts.workspace ?? '',
            };
            const roots = await (dirs ??= sources(opts));
            const parts = await Promise.all(
                names.map(async (name) => render(env, await resolveSnippet(name, roots), name, bag)),
            );

            return joinPrompt(parts);
        },
    };
};
