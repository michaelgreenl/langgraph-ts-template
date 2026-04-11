import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
    test: {
        environment: 'node',
        setupFiles: ['dotenv/config'],
        passWithNoTests: true,
        testTimeout: 20_000,
        include: mode === 'integration' ? ['tests/**/*.test.ts'] : ['tests/**/*.spec.ts'],
        exclude:
            mode === 'integration'
                ? ['dist/**', 'node_modules/**']
                : ['dist/**', 'node_modules/**', 'tests/**/*.test.ts'],
    },
}));
