import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import { EsbuildPlugin } from 'esbuild-loader';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { createRequire } from 'node:module';
import path from 'node:path';
import { type Configuration } from 'webpack';
import WebpackAssetsManifest from 'webpack-assets-manifest';
import WebpackBar from 'webpackbar';

import CorsWorkerPlugin from './plugins/CorsWorkerPlugin.ts';
import FeatureFlaggedSRIPlugin from './plugins/FeatureFlaggedSriPlugin.ts';
import { manifestTransform } from './plugins/assetsManifest.ts';
import { esbuildOptions, esbuildRule, sassRule } from './rules.ts';
import { type Env } from './webpack.common.ts';

const require = createRequire(import.meta.url);
const { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity');

export default (env: Env = {}): Configuration => {
  const develop = Boolean(env.develop);

  const config: Configuration = {
    name: 'swagger',
    mode: develop ? 'development' : 'production',
    devtool: develop ? 'eval-source-map' : 'source-map',
    entry: {
      app: './public/swagger/index.tsx',
    },
    cache: {
      type: 'filesystem',
      name: develop ? 'grafana-swagger-development' : 'grafana-swagger-production',
      buildDependencies: {
        config: [import.meta.filename],
      },
    },
    output: {
      clean: true,
      path: path.resolve(import.meta.dirname, '../../public/build-swagger'),
      publicPath: 'public/build-swagger/',
      crossOriginLoading: 'anonymous',
      filename: develop ? '[name].js' : '[name].[contenthash].js',
    },
    resolve: {
      conditionNames: ['@grafana-app/source', '...'],
      extensions: ['.ts', '.tsx', '.es6', '.js', '.json', '.svg'],
      modules: ['node_modules', path.resolve('public')],
      fallback: {
        fs: false,
      },
    },
    ignoreWarnings: [
      {
        module: /@kusto\/language-service\/bridge\.min\.js$/,
        message: /^Critical dependency: the request of a dependency is an expression$/,
      },
    ],
    module: {
      rules: [
        esbuildRule,
        sassRule,
        {
          test: /\.(svg)(\?.*)?$/,
          type: 'asset/resource',
          generator: { filename: 'static/img/[name].[hash:8][ext]' },
        },
      ],
    },
    optimization: {
      nodeEnv: develop ? 'development' : 'production',
      minimize: !develop,
      minimizer: [new EsbuildPlugin(esbuildOptions), new CssMinimizerPlugin()],
      chunkIds: develop ? 'named' : 'deterministic',
    },
    plugins: [
      new CorsWorkerPlugin(),
      new MiniCssExtractPlugin({
        filename: develop ? '[name].css' : '[name].[contenthash].css',
      }),
      new SubresourceIntegrityPlugin(),
      new FeatureFlaggedSRIPlugin(),
      new WebpackAssetsManifest({
        entrypoints: true,
        integrity: true,
        integrityHashes: ['sha384', 'sha512'],
        publicPath: true,
        transform(assets, manifest) {
          const entrypointsKey = manifest.options.entrypointsKey;
          if (typeof entrypointsKey !== 'string') {
            return assets;
          }

          return manifestTransform(assets, entrypointsKey);
        },
        output: 'assets-manifest.json',
      }),
    ],
    watchOptions: {
      ignored: '**/node_modules',
    },
  };

  if (develop) {
    config.stats = 'minimal';
    config.plugins?.push(
      new WebpackBar({
        color: '#43ac33',
        name: 'Swagger',
      })
    );
  }

  return config;
};
