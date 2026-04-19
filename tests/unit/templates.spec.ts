import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createTemplateEngine } from '../../src/templates/engine.js';

const roots: string[] = [];

const makePrompts = () => ({
    global: ['general', 'security'],
    agents: {
        planner: ['research-rules'],
        coder: ['typescript'],
    },
});

const createRoot = async (custom = true): Promise<string> => {
    const root = await mkdtemp(join(tmpdir(), 'maw-templates-'));
    roots.push(root);

    if (custom) {
        await mkdir(join(root, '.maw/templates'), { recursive: true });
    }

    return root;
};

afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('template engine', () => {
    it('composes global snippets before agent snippets and prefers custom overrides', async () => {
        const root = await createRoot();
        const engine = createTemplateEngine({ prompts: makePrompts(), root });

        await writeFile(join(root, '.maw/templates/security.njk'), 'custom security\n');

        await expect(engine.compose('planner')).resolves.toBe(
            [
                'Favor small, reversible changes and prefer the simplest correct implementation.',
                'custom security',
                'Verify claims against repository evidence and call out assumptions when evidence is incomplete.',
            ].join('\n\n'),
        );
    });

    it('renders workspacePath in a custom snippet when workspace is configured', async () => {
        const root = await createRoot();
        await writeFile(join(root, '.maw/templates/workspace-note.njk'), 'Workspace path: {{ workspacePath }}\n');

        const engine = createTemplateEngine({
            prompts: {
                global: ['workspace-note'],
                agents: {
                    planner: ['research-rules'],
                },
            },
            root,
            workspace: '/repo',
        });

        await expect(engine.compose('planner')).resolves.toBe(
            [
                'Workspace path: /repo',
                'Verify claims against repository evidence and call out assumptions when evidence is incomplete.',
            ].join('\n\n'),
        );
    });

    it('uses embedded templates when the custom source directory is missing', async () => {
        const root = await createRoot(false);
        const engine = createTemplateEngine({ prompts: makePrompts(), root });

        await expect(engine.compose('coder')).resolves.toBe(
            [
                'Favor small, reversible changes and prefer the simplest correct implementation.',
                'Never inspect secrets or .env files. Prefer environment-variable references for sensitive configuration.',
                'Prefer TypeScript with explicit types, narrow public APIs, and small composable functions.',
            ].join('\n\n'),
        );
    });

    it('fails for an unknown agent', async () => {
        const root = await createRoot();
        const engine = createTemplateEngine({ prompts: makePrompts(), root });

        await expect(engine.compose('missing')).rejects.toThrow('Unknown prompt agent: missing');
    });

    it('fails when a configured snippet cannot be resolved', async () => {
        const root = await createRoot();

        const engine = createTemplateEngine({
            prompts: {
                global: ['general', 'security'],
                agents: {
                    planner: ['missing-snippet'],
                },
            },
            root,
        });

        await expect(engine.compose('planner')).rejects.toThrow('Unable to resolve snippet: missing-snippet');
    });
});
