#!/usr/bin/env node

import { spawn } from 'node:child_process';

const child = spawn('maw', process.argv.slice(2), {
    stdio: 'inherit',
});

child.on('close', (code, signal) => {
    if (signal) {
        process.exitCode = 1;
        return;
    }

    process.exitCode = code ?? 1;
});

child.on('error', (err: Error) => {
    process.stderr.write(`Unable to start maw: ${err.message}\n`);
    process.exitCode = 1;
});
