import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createScaffoldFiles, scaffold } from '../src/scaffold/index.js';

const roots: string[] = [];

const exists = async (file: string): Promise<boolean> => {
    try {
        await access(file);
        return true;
    } catch {
        return false;
    }
};

const applyScaffold = async (root: string, name: string): Promise<void> => {
    const files = createScaffoldFiles(name);

    for (const rel of scaffold.directories) {
        await mkdir(join(root, rel), { recursive: true });
    }

    for (const [rel, content] of Object.entries(files)) {
        const file = join(root, rel);

        if (await exists(file)) {
            continue;
        }

        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, content);
    }

    const file = join(root, '.gitignore');
    const text = (await exists(file)) ? await readFile(file, 'utf8') : '';
    const lines = text.split('\n').filter((line) => line.length > 0);

    for (const entry of scaffold.gitignore) {
        if (!lines.includes(entry)) {
            lines.push(entry);
        }
    }

    await writeFile(file, `${lines.join('\n')}\n`);
};

describe('scaffold handoff', () => {
    afterEach(async () => {
        await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
    });

    it('creates missing scaffold files and stays idempotent on rerun', async () => {
        const root = await mkdtemp(join(tmpdir(), 'maw-scaffold-'));
        roots.push(root);

        await writeFile(join(root, '.gitignore'), 'node_modules/\n');
        await applyScaffold(root, 'docs-agent');

        const config = await readFile(join(root, '.maw/config.json'), 'utf8');
        const ov = await readFile(join(root, '.maw/ov.conf'), 'utf8');
        const graph = join(root, '.maw/graph.ts');
        const ignore = join(root, '.gitignore');

        expect(await exists(join(root, '.maw/templates'))).toBe(true);
        expect(config).toContain('${OPENAI_API_KEY}');
        expect(ov).toContain('${OPENAI_API_KEY}');
        expect(await readFile(graph, 'utf8')).toContain("import { createGraph } from 'docs-agent';");

        await writeFile(graph, '// custom graph\n');
        await applyScaffold(root, 'docs-agent');

        expect(await readFile(graph, 'utf8')).toBe('// custom graph\n');
        expect(await readFile(ignore, 'utf8')).toBe('node_modules/\n.maw/config.json\n.maw/ov.conf\n');
    });
});
