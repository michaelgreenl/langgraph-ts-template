import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(dir, '../..');
const pkg: unknown = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const bin = readFileSync(resolve(root, 'src/bin.ts'), 'utf8');

describe('package metadata', () => {
    it('keeps husky out of the consumer install path', () => {
        expect(pkg).not.toMatchObject({
            dependencies: { husky: expect.any(String) },
        });
        expect(pkg).not.toMatchObject({
            scripts: { prepare: expect.any(String) },
        });
        expect(pkg).not.toMatchObject({
            scripts: { prepare: expect.stringContaining('husky') },
        });
    });

    it('publishes scaffold assets and subpath exports for maw-cli init', () => {
        expect(pkg).toMatchObject({
            files: expect.arrayContaining(['src/scaffold/assets']),
            exports: {
                './config': expect.anything(),
                './scaffold': {
                    import: './dist/scaffold/index.js',
                    types: './dist/scaffold/index.d.ts',
                },
            },
        });
    });

    it('depends on and proxies to maw-cli', () => {
        expect(pkg).toMatchObject({
            dependencies: { 'maw-cli': expect.any(String) },
        });
        expect(pkg).not.toMatchObject({
            dependencies: { maw: expect.any(String) },
        });
        expect(bin).toContain("spawn('maw-cli'");
        expect(bin).toContain('Unable to start maw-cli');
    });
});
