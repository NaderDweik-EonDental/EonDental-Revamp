import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { rspack, type Configuration } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';

const context = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';
const publicPath =
  process.env.PUBLIC_PATH ?? process.env.VITE_BASE_PATH ?? '/';

function loadEnvFile(file: string): void {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

if (isDev) {
  loadEnvFile(path.join(context, '.env.development'));
  loadEnvFile(path.join(context, '.env'));
}

function remote(name: string, envKey: string, fallback: string): string {
  return `${name}@${process.env[envKey] ?? fallback}`;
}

const shared = {
  react: { singleton: true, requiredVersion: '^19.0.0', eager: true },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0', eager: true },
  'react/jsx-runtime': {
    singleton: true,
    requiredVersion: '^19.0.0',
    eager: true,
  },
};

const config: Configuration = {
  context,
  mode: isDev ? 'development' : 'production',
  entry: { main: './src/main.tsx' },
  output: {
    path: path.join(context, 'dist'),
    uniqueName: 'shell',
    publicPath,
    clean: true,
    filename: isDev ? '[name].js' : '[name].[contenthash:8].js',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    extensionAlias: { '.js': ['.ts', '.tsx', '.js'] },
  },
  module: {
    rules: [
      { test: /\.(png|jpe?g|gif|svg|stl)$/i, type: 'asset/resource' },
      { test: /\.css$/, type: 'css' },
      {
        test: /\.[jt]sx?$/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            transform: {
              react: {
                runtime: 'automatic',
                development: isDev,
                refresh: isDev,
              },
            },
          },
        },
      },
    ],
  },
  plugins: [
    new rspack.DefinePlugin({
      'import.meta.env.DEV': JSON.stringify(isDev),
      'import.meta.env.PROD': JSON.stringify(!isDev),
      'import.meta.env.BASE_URL': JSON.stringify(publicPath),
      'import.meta.env.MODE': JSON.stringify(
        isDev ? 'development' : 'production',
      ),
      'import.meta.env.VITE_ENABLE_VIEW_SWITCHER': JSON.stringify(
        process.env.VITE_ENABLE_VIEW_SWITCHER ?? (isDev ? 'true' : ''),
      ),
      'import.meta.env.VITE_CASE_SUBMISSION_REMOTE': JSON.stringify(
        process.env.VITE_CASE_SUBMISSION_REMOTE ?? '',
      ),
      'import.meta.env.VITE_SMILE_SIMULATION_REMOTE': JSON.stringify(
        process.env.VITE_SMILE_SIMULATION_REMOTE ?? '',
      ),
      'import.meta.env.VITE_3D_VIEWER_REMOTE': JSON.stringify(
        process.env.VITE_3D_VIEWER_REMOTE ?? '',
      ),
      'import.meta.env.VITE_TREATMENT_PLAN_REMOTE': JSON.stringify(
        process.env.VITE_TREATMENT_PLAN_REMOTE ?? '',
      ),
    }),
    new rspack.HtmlRspackPlugin({ template: './index.html' }),
    new ModuleFederationPlugin({
      name: 'shell',
      filename: 'remoteEntry.js',
      dts: false,
      manifest: true,
      remotes: {
        featureCaseSubmission: remote(
          'featureCaseSubmission',
          'VITE_CASE_SUBMISSION_REMOTE',
          'http://localhost:5001/mf-manifest.json',
        ),
        featureSmileSimulation: remote(
          'featureSmileSimulation',
          'VITE_SMILE_SIMULATION_REMOTE',
          'http://localhost:5002/mf-manifest.json',
        ),
        feature3dViewer: remote(
          'feature3dViewer',
          'VITE_3D_VIEWER_REMOTE',
          'http://localhost:5003/mf-manifest.json',
        ),
        featureTreatmentPlan: remote(
          'featureTreatmentPlan',
          'VITE_TREATMENT_PLAN_REMOTE',
          'http://localhost:5004/mf-manifest.json',
        ),
      },
      shared,
    }),
    ...(isDev ? [new ReactRefreshRspackPlugin()] : []),
  ],
  devServer: {
    port: 5000,
    host: '0.0.0.0',
    hot: true,
    historyApiFallback: true,
    static: false,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  experiments: { css: true },
  performance: { hints: false },
  optimization: { runtimeChunk: false },
};

export default config;
