import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
const files = {
    config: 'config.json',
    graph: 'graph.ts.template',
    opencode: 'opencode.json',
};
const prompts = {
    coder: 'coder.md',
    manager: 'manager.md',
    planner: 'planner.md',
};
const tree = z.lazy(() => z.union([z.string(), z.boolean(), z.record(z.string(), tree)]));
const matterSchema = z.object({
    description: z.string().min(1),
    hidden: z.boolean().optional(),
    mode: z.enum(['primary', 'subagent']),
    permission: z.record(z.string(), tree).optional(),
    tools: z.record(z.string(), z.boolean()).optional(),
});
const resolveAsset = (file) => {
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
const resolvePrompt = (file) => {
    const path = fileURLToPath(new URL(`../../.opencode/agents/${file}`, import.meta.url));
    if (existsSync(path)) {
        return path;
    }
    throw new Error(`Unable to locate scaffold prompt: ${file}`);
};
const raw = (name) => readFileSync(resolvePrompt(prompts[name]), 'utf8');
const matter = (text) => {
    const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!match) {
        throw new Error('Expected packaged agent instructions to include frontmatter.');
    }
    const block = match[1];
    if (typeof block !== 'string') {
        throw new Error('Expected packaged agent frontmatter content.');
    }
    return block;
};
const unquote = (text) => {
    if ((text.startsWith("'") && text.endsWith("'")) ||
        (text.startsWith('"') && text.endsWith('"'))) {
        return text.slice(1, -1);
    }
    return text;
};
const value = (text) => {
    const item = unquote(text);
    if (item === 'true') {
        return true;
    }
    if (item === 'false') {
        return false;
    }
    return item;
};
const parseMatter = (text) => {
    const root = {};
    const stack = [{ indent: -1, obj: root }];
    for (const rawLine of text.split('\n')) {
        if (rawLine.trim().length === 0) {
            continue;
        }
        const indent = rawLine.match(/^ */)?.[0].length ?? 0;
        const line = rawLine.trim();
        const split = line.indexOf(':');
        if (split === -1) {
            throw new Error(`Invalid packaged agent frontmatter line: ${line}`);
        }
        const key = unquote(line.slice(0, split).trim());
        const item = line.slice(split + 1).trim();
        while ((stack[stack.length - 1]?.indent ?? -1) >= indent) {
            stack.pop();
        }
        const top = stack[stack.length - 1];
        if (!top) {
            throw new Error(`Invalid packaged agent frontmatter indentation near: ${line}`);
        }
        if (item.length === 0) {
            const child = {};
            top.obj[key] = child;
            stack.push({ indent, obj: child });
            continue;
        }
        top.obj[key] = value(item);
    }
    return root;
};
const strip = (text) => text.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
export const readAsset = (name) => readFileSync(resolveAsset(files[name]), 'utf8');
export const readAgentMeta = (name) => matterSchema.parse(parseMatter(matter(raw(name))));
export const readPrompt = (name) => strip(raw(name));
