import type { UserConfig } from '@commitlint/types';

const cfg = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'body-max-line-length': [0, 'always', 0],
        'type-enum': [
            2,
            'always',
            [
                'build',
                'chore',
                'ci',
                'config',
                'docs',
                'feat',
                'fix',
                'perf',
                'refactor',
                'revert',
                'style',
                'test',
                'wip',
            ],
        ],
    },
} satisfies UserConfig;

module.exports = cfg;
