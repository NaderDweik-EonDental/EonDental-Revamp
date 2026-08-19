/**
 * Unused by apps. Each app/remote has a full rspack.config.ts instead.
 * Kept as a reference for the shared Module Federation + SWC shape.
 */
import path from 'node:path';
import { rspack, type Configuration } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';

export const SHARED_REACT = {
  react: { singleton: true, requiredVersion: '^19.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  'react/jsx-runtime': { singleton: true, requiredVersion: '^19.0.0' },
} as const;

export interface FederationAppOptions {
  context: string;
  name: string;
  port: number;
  entry: string;
  htmlTemplate: string;
  exposes?: Record<string, string>;
  remotes?: Record<string, string>;
  aliases?: Record<string, string>;
  copyPublic?: boolean;
  /** Values already JSON-stringified or booleans — passed through DefinePlugin. */
  defines?: Record<string, string>;
  /** Host uses an extra eager React copy so the first paint is not a share waterfall. */
  eagerShared?: boolean;
  /** If true, this app is the shell (publicPath `/` in local dev). Remotes use `auto`. */
  isHost?: boolean;
}

export function createFederationApp(
  options: FederationAppOptions,
): Configuration {
  const isDev = process.env.NODE_ENV !== 'production';
  const publicPath =
    process.env.PUBLIC_PATH ??
    process.env.VITE_BASE_PATH ??
    (options.isHost ? '/' : 'auto');
  const shared = Object.fromEntries(
    Object.entries(SHARED_REACT).map(([key, value]) => [
      key,
      { ...value, eager: true },
    ]),
  );

  return {
    context: options.context,
    mode: isDev ? 'development' : 'production',
    entry: { main: options.entry },
    output: {
      path: path.join(options.context, 'dist'),
      uniqueName: options.name,
      publicPath,
      clean: true,
      filename: isDev ? '[name].js' : '[name].[contenthash:8].js',
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
      extensionAlias: {
        '.js': ['.ts', '.tsx', '.js'],
      },
      alias: options.aliases,
    },
    module: {
      rules: [
        {
          test: /\.(png|jpe?g|gif|svg|stl)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.css$/,
          type: 'css',
        },
        {
          test: /\.[jt]sx?$/,
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
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
        'import.meta.env.MODE': JSON.stringify(isDev ? 'development' : 'production'),
        ...options.defines,
      }),
      new rspack.HtmlRspackPlugin({
        template: options.htmlTemplate,
      }),
      ...(options.copyPublic
        ? [
            new rspack.CopyRspackPlugin({
              patterns: [{ from: 'public', to: '.' }],
            }),
          ]
        : []),
      new ModuleFederationPlugin({
        name: options.name,
        filename: 'remoteEntry.js',
        dts: false,
        manifest: true,
        exposes: options.exposes,
        remotes: options.remotes,
        shared,
      }),
      ...(isDev ? [new ReactRefreshRspackPlugin()] : []),
    ],
    devServer: {
      port: options.port,
      host: '0.0.0.0',
      hot: true,
      historyApiFallback: true,
      static: options.copyPublic
        ? { directory: path.join(options.context, 'public') }
        : false,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
    experiments: {
      css: true,
    },
    performance: {
      hints: false,
    },
    optimization: {
      runtimeChunk: false,
    },
  };
}
