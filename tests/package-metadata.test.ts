import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, '..');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
    scripts?: Record<string, string>;
};

describe('package metadata', () => {
    it('keeps husky out of the consumer install path', () => {
        expect(packageJson.dependencies).not.toHaveProperty('husky');
        expect(packageJson.scripts).not.toHaveProperty('prepare');
        expect(packageJson.scripts?.prepare ?? '').not.toContain('husky');
    });
});
