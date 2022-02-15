const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PATHS = {
    app: __dirname,
    src: path.join(__dirname, 'src'),
    build: path.join(__dirname, 'build')
};

const package = require('./package.json');
const banner = package.name + ' v' + package.version + '\n' + 'Copyright (c) Tom W Hall 2020';

const common = {
    entry: {
        [package.name]: path.join(PATHS.src, 'js/index.ts')
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.css']
    },
    externals: {
        'p2': 'p2'
    },
    output: {
        path: PATHS.build,
        filename: '[name].[hash].js'
    },
    stats: {
        colors: true,
        modules: true,
        reasons: true,
        errorDetails: true
    },
    module: {
        rules: [
            {
                test: /.ts(x?)$/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true
                },
                include: PATHS.src
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin({
            cleanStaleWebpackAssets: false
        }),
        new CopyWebpackPlugin({
            patterns: [
                {from: path.join(PATHS.app, 'lib'), to: path.join(PATHS.build, 'lib')},
                {from: path.join(PATHS.src, 'img'), to: path.join(PATHS.build, 'img')},
                {from: path.join(PATHS.src, 'css'), to: path.join(PATHS.build, 'css')}
            ],
        }),
        new HtmlWebpackPlugin({
            template: path.join(PATHS.src, 'index.html')
        })
    ],
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendor',
                    chunks: 'all'
                }
            }
        }
    }
};

const dev = merge(common, {
    mode: 'development',
    devtool: 'eval-source-map',
    plugins: [
        new webpack.WatchIgnorePlugin({ paths: [
            /\.js$/,
            /\.d\.ts$/
        ]})
    ]
});

const release = merge(common, {
    mode: 'production',
    plugins: [
        new webpack.BannerPlugin({
            banner: banner
        })
    ]
});

module.exports = env => {
    if (env && env.release) {
        return release;
    }

    return dev;
}