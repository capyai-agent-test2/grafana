import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import { EsbuildPlugin } from 'esbuild-loader';
import { createRequire } from 'node:module';
import path from 'node:path';
import webpack, { type Configuration } from 'webpack';
import WebpackAssetsManifest from 'webpack-assets-manifest';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import { merge } from 'webpack-merge';

import FeatureFlaggedSRIPlugin from './plugins/FeatureFlaggedSriPlugin.ts';
import { manifestTransform } from './plugins/assetsManifest.ts';
import { esbuildOptions } from './rules.ts';
import common, { type Env } from './webpack.common.ts';
import swaggerConfig from './webpack.swagger.ts';

// SRI plugin has broken esm builds so we use require.
// https://github.com/waysact/webpack-subresource-integrity/issues/236
const require = createRequire(import.meta.url);
const { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity');

export default (env: Env = {}) => {
  const prodConfig: Configuration = {
    name: 'grafana',
    mode: 'production',
    devtool: process.env.NO_SOURCEMAP === '1' ? false : 'source-map',

    output: {
      crossOriginLoading: 'anonymous',
    },

    optimization: {
      nodeEnv: 'production',
      minimize: Number(env.noMinify) !== 1,
      minimizer: [new EsbuildPlugin(esbuildOptions), new CssMinimizerPlugin()],
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        minChunks: 1,
        cacheGroups: {
          moment: {
            test: /[\\/]node_modules[\\/]moment[\\/].*[jt]sx?$/,
            chunks: 'initial',
            priority: 20,
            enforce: true,
          },
          defaultVendors: {
            test: /[\\/]node_modules[\\/].*[jt]sx?$/,
            chunks: 'initial',
            priority: -10,
            reuseExistingChunk: true,
            enforce: true,
          },
          default: {
            priority: -20,
            chunks: 'all',
            test: /.*[jt]sx?$/,
            reuseExistingChunk: true,
          },
        },
      },
    },

    // enable persistent cache for faster builds
    cache:
      Number(env.noMinify) === 1
        ? false
        : {
            type: 'filesystem',
            name: 'grafana-default-production',
            buildDependencies: {
              config: [import.meta.filename],
            },
          },

    plugins: [
      new SubresourceIntegrityPlugin(),
      new FeatureFlaggedSRIPlugin(),
      /**
       * I know we have two manifest plugins here.
       * WebpackManifestPlugin was only used in prod before and does not support integrity hashes
       */
      new WebpackAssetsManifest({
        entrypoints: true,
        integrity: true,
        integrityHashes: ['sha384', 'sha512'],
        publicPath: true,
        // This transform filters down the assets to only include the ones that are part of the entrypoints
        // this is all that the backend requires.
        transform(assets, manifest) {
          const entrypointsKey = manifest.options.entrypointsKey;
          if (typeof entrypointsKey !== 'string') {
            return assets;
          }

          return manifestTransform(assets, entrypointsKey);
        },
        output: env.react19 ? 'assets-manifest-react19.json' : 'assets-manifest.json',
      }),
      new WebpackManifestPlugin({
        fileName: path.join(process.cwd(), env.react19 ? 'manifest-react19.json' : 'manifest.json'),
        filter: (file) => !file.name.endsWith('.map'),
      }),
      function () {
        this.hooks.done.tap('Done', function (stats) {
          if (stats.compilation.errors && stats.compilation.errors.length) {
            console.log(stats.compilation.errors);
            process.exit(1);
          }
        });
      },
    ],
  };

  const configs = Object.assign([merge(common(env), prodConfig)], { parallelism: 2 });
  if (!env.react19) {
    configs.push(swaggerConfig(env));
  }
  return configs;
};
