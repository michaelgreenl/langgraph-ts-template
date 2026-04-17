import { defineConfig } from 'vitest/config';

const exclude = ['dist/**', 'node_modules/**'] as const;

export default defineConfig(({ mode }) => ({
    test: {
        environment: 'node',
        setupFiles: ['dotenv/config'],
        passWithNoTests: true,
        testTimeout: 20_000,
        include: mode === 'integration' ? ['tests/**/*.test.ts'] : ['tests/**/*.spec.ts'],
        exclude: mode === 'integration' ? [...exclude] : [...exclude, 'tests/**/*.test.ts'],
    },
}));
