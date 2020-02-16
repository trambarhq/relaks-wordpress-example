const _ = require('lodash');
const Path = require('path');
const Webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const DefinePlugin = Webpack.DefinePlugin;
const NamedChunksPlugin = Webpack.NamedChunksPlugin;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const MiniCSSExtractPlugin = require("mini-css-extract-plugin");

const EVENT = process.env.npm_lifecycle_event;
const BUILD = (EVENT === 'build') ? 'production' : 'development';
const IS_DEV_SERVER = !!process.argv.find(arg => arg.includes('webpack-dev-server'));
const DEV_DATA_HOST = (IS_DEV_SERVER) ? 'http://localhost:8000' : undefined;
const CORDOVA_DATA_HOST = process.env.CORDOVA_DATA_HOST;
const BASE_PATH = '/';

const clientConfig = {
  mode: BUILD,
  context: Path.resolve('./src'),
  entry: './main',
  output: {
    path: Path.resolve('./server/www'),
    publicPath: BASE_PATH,
    filename: 'front-end.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: [
            '@babel/env',
            '@babel/react',
          ],
          plugins: [
            '@babel/transform-runtime',
          ]
        }
      },
      {
        test: /\.scss$/,
        use: [
          MiniCSSExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ],
      },
      {
        test: /fonts.*\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader',
      },
      {
        test: /fonts.*\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader',
        query: {
          emitFile: false,
        }
      },
    ]
  },
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(BUILD),
      'process.env.TARGET': JSON.stringify('browser'),
      'process.env.DATA_HOST': JSON.stringify(DEV_DATA_HOST),
      'process.env.BASE_PATH': JSON.stringify(BASE_PATH),
    }),
    new NamedChunksPlugin,
    new BundleAnalyzerPlugin({
      analyzerMode: (EVENT === 'build') ? 'static' : 'disabled',
      reportFilename: `report.html`,
    }),
    new MiniCSSExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
  ],
  optimization: {
    concatenateModules: false,
  },
  devtool: (EVENT === 'build') ? 'source-map' : 'inline-source-map',
};

const serverConfig = {
  mode: clientConfig.mode,
  context: clientConfig.context,
  entry: './ssr',
  target: 'node',
  output: {
    path: Path.resolve('./server/client'),
    publicPath: BASE_PATH,
    filename: 'front-end.js',
    libraryTarget: 'commonjs',
  },
  module: clientConfig.module,
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(BUILD),
      'process.env.TARGET': JSON.stringify('node'),
      'process.env.DATA_HOST': JSON.stringify(undefined),
      'process.env.BASE_PATH': JSON.stringify(BASE_PATH),
    }),
    new NamedChunksPlugin,
    new HtmlWebpackPlugin({
      template: Path.resolve(`./src/index.html`),
      filename: 'index.html',
    }),
    new MiniCSSExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
  ],
  devtool: clientConfig.devtool,
};

const cordovaConfig = {
  context: clientConfig.context,
  entry: clientConfig.entry,
  output: {
    path: Path.resolve('./cordova/sample-app/www'),
    publicPath: '',
    filename: 'front-end.js',
  },
  module: clientConfig.module,
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(BUILD),
      'process.env.TARGET': JSON.stringify('browser'),
      'process.env.DATA_HOST': JSON.stringify(CORDOVA_DATA_HOST),
      'process.env.BASE_PATH': JSON.stringify(BASE_PATH),
    }),
    new NamedChunksPlugin,
    new HtmlWebpackPlugin({
      template: Path.resolve(`./src/index.html`),
      filename: 'index.html',
      cordova: true,
      host: CORDOVA_DATA_HOST
    }),
    new MiniCSSExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
  ],
};

const configs = module.exports = [];

if (IS_DEV_SERVER) {
  // need HTML page
  clientConfig.plugins.push(new HtmlWebpackPlugin({
    template: Path.resolve(`./src/index.html`),
    filename: 'index.html',
  }));
  // config dev-server to support client-side routing
  clientConfig.devServer = {
    inline: true,
    historyApiFallback: true,
  };
  configs.push(clientConfig);
} else {
  configs.push(clientConfig, serverConfig)
  if (CORDOVA_DATA_HOST) {
    configs.push(cordovaConfig);
    console.log('Building for Cordova: ' + CORDOVA_DATA_HOST);
  }
}
