#!/usr/bin/env node
/**
 * Build shell + three federation remotes for GitHub Pages.
 *
 * Env (set by CI or locally):
 *   PAGES_BASE_PATH  — e.g. /EonDental-Revamp/  (leading + trailing slash)
 *   PAGES_ORIGIN     — e.g. https://naderdweik-eondental.github.io
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'EonDental-Revamp';
const basePath = normalizeBasePath(
  process.env.PAGES_BASE_PATH ?? `/${repoName}/`,
);
const origin = (process.env.PAGES_ORIGIN ?? 'https://naderdweik-eondental.github.io').replace(
  /\/$/,
  '',
);
const siteUrl = `${origin}${basePath}`;

const remotes = [
  {
    name: 'case-submission',
    package: '@eon/feature-case-submission',
    dist: join(root, 'remotes/feature-case-submission/dist'),
    base: `${basePath}remotes/case-submission/`,
    envKey: 'VITE_CASE_SUBMISSION_REMOTE',
  },
  {
    name: 'smile-simulation',
    package: '@eon/feature-smile-simulation',
    dist: join(root, 'remotes/feature-smile-simulation/dist'),
    base: `${basePath}remotes/smile-simulation/`,
    envKey: 'VITE_SMILE_SIMULATION_REMOTE',
  },
  {
    name: '3d-viewer',
    package: '@eon/feature-3d-viewer',
    dist: join(root, 'remotes/feature-3d-viewer/dist'),
    base: `${basePath}remotes/3d-viewer/`,
    envKey: 'VITE_3D_VIEWER_REMOTE',
  },
];

const pagesDist = join(root, 'pages-dist');

function normalizeBasePath(path) {
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Building GitHub Pages site`);
console.log(`  origin:   ${origin}`);
console.log(`  base:     ${basePath}`);
console.log(`  site URL: ${siteUrl}`);

run('pnpm', ['install', '--frozen-lockfile']);

for (const pkg of [
  '@eon/core-entitlements',
  '@eon/core-config-client',
  '@eon/core-sdk',
  '@eon/mocks-config-api',
]) {
  run('pnpm', ['--filter', pkg, 'build']);
}

for (const remote of remotes) {
  console.log(`\n→ ${remote.package} (base ${remote.base})`);
  const remoteEnv = { VITE_BASE_PATH: remote.base };
  if (remote.name === 'smile-simulation') {
    for (const key of [
      'VITE_HF_TOKEN',
      'VITE_HF_IMAGE_MODEL',
      'VITE_HF_PROVIDER',
    ]) {
      if (process.env[key]) remoteEnv[key] = process.env[key];
    }
  }
  run('pnpm', ['--filter', remote.package, 'build'], remoteEnv);
}

const shellEnv = {
  VITE_BASE_PATH: basePath,
  VITE_ENABLE_MSW: 'true',
  // VITE_ENABLE_VIEW_SWITCHER: 'true',
};
for (const remote of remotes) {
  shellEnv[remote.envKey] = `${siteUrl}remotes/${remote.name}/mf-manifest.json`;
}

console.log('\n→ @eon/shell');
console.log('  remotes:', remotes.map((r) => shellEnv[r.envKey]).join('\n           '));
run('pnpm', ['--filter', '@eon/shell', 'build'], shellEnv);

console.log('\n→ assembling pages-dist');
rmSync(pagesDist, { recursive: true, force: true });
mkdirSync(pagesDist, { recursive: true });

const shellDist = join(root, 'apps/shell/dist');
cpSync(shellDist, pagesDist, { recursive: true });

const indexHtml = readFileSync(join(pagesDist, 'index.html'), 'utf8');
writeFileSync(join(pagesDist, '404.html'), indexHtml);

mkdirSync(join(pagesDist, 'remotes'), { recursive: true });
for (const remote of remotes) {
  const target = join(pagesDist, 'remotes', remote.name);
  cpSync(remote.dist, target, { recursive: true });
}

console.log(`\nDone. Static site ready at ${pagesDist}`);
console.log(`Publish URL: ${siteUrl}`);
