import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createConfig, loadConfig, resolveEnvVars } from '../src/config.js';

describe('MAW config', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('keeps secret placeholders in the scaffold defaults', () => {
        const cfg = createConfig();

        expect(cfg.llm.apiKey).toBe('${OPENAI_API_KEY}');
    });

    it('resolves environment variables in nested objects and arrays', () => {
        vi.stubEnv('OPENAI_API_KEY', 'sk-test');
        vi.stubEnv('REPO_TOKEN', 'repo-secret');

        const cfg = resolveEnvVars({
            llm: {
                apiKey: '${OPENAI_API_KEY}',
            },
            templates: {
                gitRepos: ['https://example.com/${REPO_TOKEN}'],
            },
        });

        expect(cfg).toEqual({
            llm: {
                apiKey: 'sk-test',
            },
            templates: {
                gitRepos: ['https://example.com/repo-secret'],
            },
        });
    });

    it('throws when a referenced variable is missing', () => {
        expect(() =>
            resolveEnvVars({
                llm: {
                    apiKey: '${MISSING_KEY}',
                },
            }),
        ).toThrow('Environment variable MISSING_KEY is not set but referenced in .maw/config.json');
    });

    it('loads config from disk and resolves placeholders before validation', async () => {
        vi.stubEnv('OPENAI_API_KEY', 'sk-live');
        vi.stubEnv('OV_HOST', '127.0.0.1');

        const dir = await mkdtemp(join(tmpdir(), 'maw-config-'));
        const file = join(dir, 'config.json');

        await writeFile(
            file,
            JSON.stringify({
                ...createConfig(),
                openviking: {
                    enabled: true,
                    host: '${OV_HOST}',
                    port: 1933,
                },
            }),
        );

        await expect(loadConfig(file)).resolves.toMatchObject({
            llm: {
                apiKey: 'sk-live',
            },
            openviking: {
                host: '127.0.0.1',
            },
        });

        await rm(dir, { recursive: true, force: true });
    });
});
