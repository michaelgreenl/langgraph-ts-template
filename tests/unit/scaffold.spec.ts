import { describe, expect, it } from 'vitest';
import { createScaffoldFiles, readScaffoldAsset, scaffold } from '../../src/scaffold/index.js';

describe('MAW scaffold contract', () => {
    it('defines the maw-cli init handoff rules', () => {
        expect(scaffold.packageName.length).toBeGreaterThan(0);
        expect(scaffold.directories).toContain('.maw/templates');
        expect(scaffold.gitignore).toEqual(['.maw/config.json', '.maw/ov.conf']);
        expect(scaffold.rules).toEqual({
            overwrite: 'preserve',
            gitignoreMerge: 'append-once',
        });
    });

    it('points maw-cli init at the packaged asset sources', () => {
        expect(scaffold.assets.config.target).toBe('.maw/config.json');
        expect(scaffold.assets.ov.target).toBe('.maw/ov.conf');
        expect(scaffold.assets.graph.target).toBe('.maw/graph.ts');
        expect(readScaffoldAsset('config')).toContain('"workspace": "."');
        expect(readScaffoldAsset('ov')).toContain('${OPENAI_API_KEY}');
    });

    it('renders the target graph entry for the installed workflow package', () => {
        const files = createScaffoldFiles('docs-agent');

        expect(files['.maw/graph.ts']).toContain("import { createGraph } from 'docs-agent';");
        expect(files['.maw/graph.ts']).toContain('export const graph = createGraph();');
    });

    it('keeps secret placeholders in scaffolded file contents', () => {
        const files = createScaffoldFiles('docs-agent');

        expect(files['.maw/config.json']).toContain('${OPENAI_API_KEY}');
        expect(files['.maw/ov.conf']).toContain('${OPENAI_API_KEY}');
    });
});
