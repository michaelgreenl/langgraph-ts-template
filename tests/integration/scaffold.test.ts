import { access, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createScaffoldFiles, scaffold, templateDir } from '../../src/scaffold/index.js';

const roots: string[] = [];

describe('scaffold handoff', () => {
    afterEach(async () => {
        await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
    });

    it('creates workflow-owned scaffold files and stays idempotent on rerun', async () => {
        const root = await mkdtemp(join(tmpdir(), 'maw-scaffold-'));
        roots.push(root);

        expect(scaffold.workflow.length).toBeGreaterThan(0);

        const files = createScaffoldFiles();

        expect(Object.keys(files).sort()).toEqual(['config.json', 'graph.ts']);

        await writeFile(join(root, 'graph.ts'), files['graph.ts']);
        await writeFile(join(root, 'config.json'), files['config.json']);

        expect(await readFile(join(root, 'graph.ts'), 'utf8')).toContain(
            `import { createGraph } from '${scaffold.packageName}';`,
        );
        expect(await readFile(join(root, 'graph.ts'), 'utf8')).toContain(
            `createGraph({ workflow: '${scaffold.workflow}' })`,
        );
        expect(() => JSON.parse(files['config.json'])).not.toThrow();
        expect(createScaffoldFiles()).toEqual(files);
    });

    it('publishes embedded templates for prompt preview consumers', async () => {
        await access(templateDir);

        expect((await readdir(templateDir)).some((name) => name.endsWith('.njk'))).toBe(true);
    });
});
