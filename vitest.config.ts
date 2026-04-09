import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
    test: {
        environment: 'node',
        setupFiles: ['dotenv/config'],
        passWithNoTests: true,
        testTimeout: 20_000,
        include: mode === 'integration' ? ['tests/**/*.int.test.ts'] : ['tests/**/*.test.ts'],
        exclude:
            mode === 'integration'
                ? ['dist/**', 'node_modules/**']
                : ['dist/**', 'node_modules/**', 'tests/**/*.int.test.ts'],
    },
}));
