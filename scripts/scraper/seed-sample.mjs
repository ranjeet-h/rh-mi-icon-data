#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';

const SAMPLE_ICONS = ['search', 'home', 'arrow_back', 'menu', 'close', 'settings'];
const scriptPath = path.resolve(process.cwd(), 'scripts/scraper/scrape-icons.mjs');

const child = spawn(process.execPath, [scriptPath, `--icons=${SAMPLE_ICONS.join(',')}`], {
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});

