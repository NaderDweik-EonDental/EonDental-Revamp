#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdirSync, createWriteStream } from 'node:fs';
import { join } from 'node:path';

const apps = [
  {
    name: 'Shell',
    filter: '@eon/shell',
    url: 'http://localhost:5000/',
    ready: /Local:\s+http:\/\/localhost:5000/,
  },
  {
    name: 'Case submission',
    filter: '@eon/feature-case-submission',
    url: 'http://localhost:5001/',
    ready: /Local:\s+http:\/\/localhost:5001/,
  },
  {
    name: 'Smile simulation',
    filter: '@eon/feature-smile-simulation',
    url: 'http://localhost:5002/',
    ready: /Local:\s+http:\/\/localhost:5002/,
  },
  {
    name: '3D viewer',
    filter: '@eon/feature-3d-viewer',
    url: 'http://localhost:5003/',
    ready: /Local:\s+http:\/\/localhost:5003/,
  },
];

const logDir = join(process.cwd(), '.logs');
mkdirSync(logDir, { recursive: true });

const children = [];
const ready = new Set();
let shuttingDown = false;

function printBanner() {
  console.clear?.();
  console.log('');
  console.log('EON local apps');
  console.log('──────────────');
  for (const app of apps) {
    const status = ready.has(app.filter) ? 'ready' : 'starting…';
    console.log(app.name);
    console.log(`  ${app.url}  (${status})`);
  }
  console.log('');
  console.log('Logs: .logs/*.log');
  console.log('Stop: Ctrl+C');
  console.log('');
}

function markReady(filter) {
  if (ready.has(filter)) return;
  ready.add(filter);
  printBanner();
  if (ready.size === apps.length) {
    console.log('All apps ready.');
    console.log('');
  }
}

function startApp(app) {
  const logPath = join(logDir, `${app.filter.replace('@eon/', '')}.log`);
  const logStream = createWriteStream(logPath, { flags: 'w' });

  const child = spawn(
    'pnpm',
    ['--filter', app.filter, 'dev'],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    },
  );

  children.push(child);

  const onChunk = (chunk) => {
    const text = chunk.toString();
    logStream.write(text);
    if (app.ready.test(text)) {
      markReady(app.filter);
    }
    // Surface real failures briefly in the quiet console.
    if (/error|failed|EADDRINUSE/i.test(text) && !/Federated types/i.test(text)) {
      const line = text
        .split('\n')
        .map((l) => l.trim())
        .find((l) => /error|failed|EADDRINUSE/i.test(l));
      if (line) {
        console.error(`[${app.name}] ${line}`);
      }
    }
  };

  child.stdout.on('data', onChunk);
  child.stderr.on('data', onChunk);

  child.on('exit', (code, signal) => {
    logStream.end();
    if (shuttingDown) return;
    if (code && code !== 0) {
      console.error(
        `[${app.name}] exited with code ${code}${signal ? ` (${signal})` : ''}. See ${logPath}`,
      );
    }
  });
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\nStopping apps…');
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) child.kill('SIGKILL');
    }
    process.exit(0);
  }, 1500).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

printBanner();
for (const app of apps) {
  startApp(app);
}
