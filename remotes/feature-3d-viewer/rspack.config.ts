import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rspack, type Configuration } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';

const context = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';
const publicPath =
  process.env.PUBLIC_PATH ?? process.env.VITE_BASE_PATH ?? 'auto';

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
  entry: { main: './src/dev-entry.ts' },
  output: {
    path: path.join(context, 'dist'),
    uniqueName: 'feature3dViewer',
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
    }),
    new rspack.HtmlRspackPlugin({ template: './index.html' }),
    new ModuleFederationPlugin({
      name: 'feature3dViewer',
      filename: 'remoteEntry.js',
      dts: false,
      manifest: true,
      exposes: {
        './FeatureRoot': './src/FeatureRoot.tsx',
      },
      shared,
    }),
    ...(isDev ? [new ReactRefreshRspackPlugin()] : []),
  ],
  devServer: {
    port: 5003,
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
