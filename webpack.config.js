var FS = require('fs');
var Path = require('path');
var Webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var DefinePlugin = Webpack.DefinePlugin;
var NamedChunksPlugin = Webpack.NamedChunksPlugin;
var NamedModulesPlugin = Webpack.NamedModulesPlugin;
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var event = process.env.npm_lifecycle_event;
var devDataHost = 'http://localhost:8000';
var cordovaDataHost = process.env.CORDOVA_DATA_HOST;

var clientConfig = {
    context: Path.resolve('./src'),
    entry: './main',
    output: {
        path: Path.resolve('./server/www'),
        publicPath: '/',
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
                use: ExtractTextPlugin.extract({
                    use: 'css-loader!sass-loader',
                })
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
        new NamedChunksPlugin,
        new NamedModulesPlugin,
        new BundleAnalyzerPlugin({
            analyzerMode: (event === 'build') ? 'static' : 'disabled',
            reportFilename: `report.html`,
        }),
        new ExtractTextPlugin("styles.css"),
    ],
    devtool: (event === 'build') ? false : 'inline-source-map',
};

var serverConfig = {
    context: clientConfig.context,
    entry: clientConfig.entry,
    target: 'node',
    output: {
        path: Path.resolve('./server/client'),
        publicPath: '/',
        filename: 'front-end.js',
        libraryTarget: 'commonjs2',
    },
    resolve: clientConfig.resolve,
    module: clientConfig.module,
    plugins: [
        new NamedChunksPlugin,
        new NamedModulesPlugin,
        new HtmlWebpackPlugin({
            template: Path.resolve(`./src/index.html`),
            filename: 'index.html',
        }),
        new ExtractTextPlugin('styles.css'),
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
        new NamedChunksPlugin,
        new NamedModulesPlugin,
        new HtmlWebpackPlugin({
            template: Path.resolve(`./src/index.html`),
            filename: 'index.html',
            cordova: true,
        }),
        new ExtractTextPlugin('styles.css'),
    ],
    devtool: clientConfig.devtool,
};

var configs = module.exports = [ clientConfig, serverConfig ];

var isDevServer = process.argv.find((arg) => {
    return arg.includes('webpack-dev-server') ;
});
if (isDevServer) {
    // remove server config
    configs.pop();
    // need HTML page
    clientConfig.plugins.push(new HtmlWebpackPlugin({
        template: Path.resolve(`./src/index.html`),
        filename: 'index.html',
    }));
    // set data host
    var constants = {
        'process.env.DATA_HOST': JSON.stringify(devDataHost),
    };
    clientConfig.plugins.unshift(new DefinePlugin(constants));
    // config dev-server to support client-side routing
    clientConfig.devServer = {
        inline: true,
        historyApiFallback: true,
    };
}

var constants = {};
if (event === 'build') {
    if (cordovaDataHost) {
        configs.push(cordovaConfig);
        console.log('Building for Cordova: ' + cordovaDataHost);
    }

    console.log('Optimizing JS code');
    configs.forEach((config) => {
        // set NODE_ENV to production
        var dataHost = (config === cordovaConfig) ? cordovaDataHost : undefined;
        var constants = {
            'process.env.NODE_ENV': JSON.stringify('production'),
            'process.env.DATA_HOST': JSON.stringify(dataHost),
        };
        config.plugins.unshift(new DefinePlugin(constants));

        // use Uglify to remove dead-code
        config.plugins.unshift(new UglifyJSPlugin({
            uglifyOptions: {
                compress: {
                  drop_console: true,
                }
            }
        }));
    })
}

// copy webpack.resolve.js into webpack.debug.js to resolve Babel presets
// and plugins to absolute paths, required when linked modules are used
if (FS.existsSync('./webpack.debug.js')) {
    configs.map(require('./webpack.debug.js'));
}
