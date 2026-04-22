import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
    DEFAULT_OPENVIKING_ENABLED,
    DEFAULT_OPENVIKING_IGNORED_EXTENSIONS,
    OPENVIKING_CLIENT_CONFIG_FILE,
    OPENVIKING_STORAGE_DIR,
    OpenVikingConfigError,
    loadOpenVikingClientConfig,
    loadOpenVikingProjectConfig,
    loadOpenVikingRuntimeConfig,
    resolveOpenVikingScope,
} from '../../src/index.js';

const roots: string[] = [];

const createRoot = async (): Promise<string> => {
    const root = await mkdtemp(join(tmpdir(), 'maw-openviking-'));
    roots.push(root);
    return root;
};

const writeJson = async (file: string, value: unknown): Promise<void> => {
    await writeFile(file, JSON.stringify(value, null, 4));
};

const writeProject = async (root: string, enabled = true): Promise<void> => {
    await writeJson(join(root, 'maw.json'), {
        openviking: enabled,
        templates: {
            customPath: '.maw/templates',
        },
    });
};

const writeClient = async (root: string, value: unknown): Promise<void> => {
    await mkdir(join(root, '.maw'), { recursive: true });
    await writeJson(join(root, '.maw/ovcli.conf'), value);
};

afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('OpenViking', () => {
    it('exports project-scoped defaults', () => {
        const root = '/repo';

        expect(DEFAULT_OPENVIKING_ENABLED).toBe(true);
        expect(DEFAULT_OPENVIKING_IGNORED_EXTENSIONS).toContain('.pdf');
        expect(OPENVIKING_CLIENT_CONFIG_FILE).toBe('.maw/ovcli.conf');
        expect(OPENVIKING_STORAGE_DIR).toBe('.maw/openviking');
        expect(resolveOpenVikingScope(root)).toEqual({
            clientConfig: join(root, '.maw/ovcli.conf'),
            projectConfig: join(root, 'maw.json'),
            root,
            storage: join(root, '.maw/openviking'),
        });
    });

    it('defaults the retrieval toggle when maw.json is missing', async () => {
        const root = await createRoot();

        await expect(loadOpenVikingProjectConfig(root)).resolves.toEqual({
            enabled: true,
        });
    });

    it('loads the retrieval toggle and client url from project files', async () => {
        const root = await createRoot();

        await writeProject(root, false);
        await writeClient(root, { url: 'http://localhost:1933' });

        const cfg = await loadOpenVikingRuntimeConfig(root);

        expect(cfg.enabled).toBe(false);
        expect(cfg.url).toBeInstanceOf(URL);
        expect(cfg.url.href).toBe('http://localhost:1933/');
        expect(cfg.scope.storage).toBe(join(root, '.maw/openviking'));
    });

    it('rejects invalid maw.json', async () => {
        const root = await createRoot();

        await writeFile(join(root, 'maw.json'), '{"openviking":');

        await expect(loadOpenVikingProjectConfig(root)).rejects.toThrow('Invalid maw.json');
    });

    it('throws an OpenViking config error when ovcli config is missing', async () => {
        const root = await createRoot();
        const err = await loadOpenVikingClientConfig(root).catch((err: unknown) => err);

        expect(err).toBeInstanceOf(OpenVikingConfigError);
        expect(err).toMatchObject({
            message: expect.stringContaining('.maw/ovcli.conf'),
        });
    });

    it('throws an OpenViking config error when ovcli config has an invalid url', async () => {
        const root = await createRoot();

        await writeClient(root, { url: 'not-a-url' });

        const err = await loadOpenVikingClientConfig(root).catch((err: unknown) => err);

        expect(err).toBeInstanceOf(OpenVikingConfigError);
        expect(err).toMatchObject({
            message: expect.stringContaining('Invalid OpenViking client config'),
        });
    });
});
