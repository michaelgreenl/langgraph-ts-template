import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(dir, '../..');
const pkg: unknown = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const name =
    typeof pkg === 'object' && pkg !== null && 'name' in pkg && typeof pkg.name === 'string'
        ? pkg.name
        : (() => {
              throw new Error('Invalid package.json: missing name.');
          })();
const req = createRequire(import.meta.url);

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
                    types: './dist/config.d.ts',
                    import: './dist/config.js',
                    default: './dist/config.js',
                },
                './scaffold': {
                    import: './dist/scaffold/index.js',
                    types: './dist/scaffold/index.d.ts',
                },
                './templates': {
                    types: './dist/templates/index.d.ts',
                    import: './dist/templates/index.js',
                    default: './dist/templates/index.js',
                },
            },
        });
    });

    it('resolves prompt-command subpaths for installed consumers', () => {
        expect(req.resolve(`${name}/config`)).toBe(resolve(root, 'dist/config.js'));
        expect(req.resolve(`${name}/templates`)).toBe(resolve(root, 'dist/templates/index.js'));
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
