var FS = require('fs');
var Path = require('path');
var Webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var DefinePlugin = Webpack.DefinePlugin;
var NamedChunksPlugin = Webpack.NamedChunksPlugin;
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var MiniCSSExtractPlugin = require("mini-css-extract-plugin");

var EVENT = process.env.npm_lifecycle_event;
var BUILD = (EVENT === 'build') ? 'production' : 'development';
var IS_DEV_SERVER = process.argv.find((arg) => { return arg.includes('webpack-dev-server') });
var DEV_DATA_HOST = (IS_DEV_SERVER) ? 'http://localhost:8000' : undefined;
var CORDOVA_DATA_HOST = process.env.CORDOVA_DATA_HOST;
var BASE_PATH = '/';

var clientConfig = {
    mode: BUILD,
    context: Path.resolve('./src'),
    entry: './main',
    output: {
        path: Path.resolve('./server/www'),
        publicPath: BASE_PATH,
        filename: 'front-end.js',
    },
    resolve: {
        extensions: [ '.js', '.jsx' ],
        modules: [ Path.resolve('./src'), Path.resolve('./node_modules') ],
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: [
                        'env',
                        'react',
                        'stage-0',
                    ],
                    plugins: [
                        'syntax-async-functions',
                        'syntax-class-properties',
                        'transform-regenerator',
                        'transform-runtime',
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
    devtool: (EVENT === 'build') ? 'source-map' : 'inline-source-map',
};

var serverConfig = {
    mode: clientConfig.mode,
    context: clientConfig.context,
    entry: clientConfig.entry,
    target: 'node',
    output: {
        path: Path.resolve('./server/client'),
        publicPath: BASE_PATH,
        filename: 'front-end.js',
        libraryTarget: 'commonjs2',
    },
    resolve: clientConfig.resolve,
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

var cordovaConfig = {
    context: clientConfig.context,
    entry: clientConfig.entry,
    output: {
        path: Path.resolve('./cordova/sample-app/www'),
        publicPath: '',
        filename: 'front-end.js',
    },
    resolve: clientConfig.resolve,
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

var configs = module.exports = [];

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

// copy webpack.resolve.js into webpack.debug.js to resolve Babel presets
// and plugins to absolute paths, required when linked modules are used
if (FS.existsSync('./webpack.debug.js')) {
    configs.map(require('./webpack.debug.js'));
}
