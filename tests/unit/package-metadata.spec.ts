import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(dir, '../..');
const pkg: unknown = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

describe('package metadata', () => {
    it('keeps husky out of the consumer install path', () => {
        expect(pkg).not.toMatchObject({
            dependencies: { husky: expect.any(String) },
        });
        expect(pkg).not.toMatchObject({
            scripts: { prepare: expect.stringContaining('husky') },
        });
    });

    it('publishes scaffold assets, templates, and subpath exports', () => {
        expect(pkg).toMatchObject({
            files: expect.arrayContaining(['src/scaffold/assets', 'src/templates/defaults']),
            exports: {
                './config': {
                    import: './dist/config.js',
                    types: './dist/config.d.ts',
                },
                './scaffold': {
                    import: './dist/scaffold/index.js',
                    types: './dist/scaffold/index.d.ts',
                },
                './templates': {
                    import: './dist/templates/index.js',
                    types: './dist/templates/index.d.ts',
                },
            },
        });
    });

    it('does not publish the retired maw-cli proxy surface', () => {
        expect(pkg).not.toMatchObject({
            dependencies: { 'maw-cli': expect.any(String) },
        });
        expect(pkg).not.toHaveProperty('bin');
        expect(pkg).not.toMatchObject({
            scripts: { 'lint:langgraph-json': expect.any(String) },
        });
        expect(pkg).toMatchObject({
            scripts: { 'lint:all': 'bun run lint && bun run format:check' },
        });
        expect(existsSync(resolve(root, 'dist/bin.js'))).toBe(false);
        expect(existsSync(resolve(root, 'dist/bin.d.ts'))).toBe(false);
        expect(existsSync(resolve(root, 'src/bin.ts'))).toBe(false);
        expect(existsSync(resolve(root, 'scripts/checkLanggraphPaths.js'))).toBe(false);
    });
});
