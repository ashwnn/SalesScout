const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

const env = dotenv.config().parsed || {};
const envKeys = Object.keys(env).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(env[next]);
    return prev;
}, {});

module.exports = (env, argv) => {
    const isDevelopment = argv.mode === 'development';
    
    return {
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: isDevelopment ? 'bundle.js' : 'static/js/[name].[contenthash:8].js',
        chunkFilename: isDevelopment ? '[name].chunk.js' : 'static/js/[name].[contenthash:8].chunk.js',
        assetModuleFilename: 'static/media/[name].[hash][ext]',
        publicPath: '/',
        pathinfo: false, // Disable path info for faster builds
        clean: true, // Clean build folder automatically
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
        alias: {
            '@': path.resolve(__dirname, 'src')
        },
        symlinks: false, // Disable if not using npm link
    },
    // Performance optimizations
    optimization: {
        removeAvailableModules: false,
        removeEmptyChunks: false,
        minimize: !isDevelopment,
        splitChunks: isDevelopment ? false : {
            chunks: 'all',
            maxInitialRequests: 25,
            minSize: 20000,
            cacheGroups: {
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    priority: 10,
                    reuseExistingChunk: true,
                },
                react: {
                    test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
                    name: 'react-vendor',
                    priority: 20,
                    reuseExistingChunk: true,
                },
                common: {
                    minChunks: 2,
                    priority: 5,
                    reuseExistingChunk: true,
                    enforce: true,
                },
            },
        },
        runtimeChunk: isDevelopment ? false : {
            name: entrypoint => `runtime-${entrypoint.name}`,
        },
        moduleIds: 'deterministic',
        usedExports: true, // Tree shaking
        sideEffects: true, // Respect package.json sideEffects
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        cacheCompression: false,
                        compact: !isDevelopment,
                        presets: [
                            ['@babel/preset-env', { 
                                modules: false,
                                useBuiltIns: 'usage',
                                corejs: 3,
                                targets: isDevelopment ? { esmodules: true } : '> 0.25%, not dead'
                            }],
                            ['@babel/preset-react', { 
                                runtime: 'automatic',
                                development: isDevelopment,
                            }],
                            '@babel/preset-typescript'
                        ],
                        plugins: [
                            '@babel/plugin-transform-runtime',
                            ...(!isDevelopment ? [
                                ['transform-remove-console', { exclude: ['error', 'warn'] }]
                            ] : [])
                        ]
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            sourceMap: isDevelopment,
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/[name][ext]'
                }
            }
        ]
    },
    cache: {
        type: 'filesystem',
        cacheDirectory: path.resolve(__dirname, '.webpack_cache'),
        buildDependencies: {
            config: [__filename], // Invalidate cache when webpack config changes
        },
    },
    // Improved source maps for faster builds
    devtool: isDevelopment ? 'eval-cheap-module-source-map' : 'source-map',
    // Performance hints
    performance: {
        hints: isDevelopment ? false : 'warning',
    },
    // Stats output configuration
    stats: {
        assets: true,
        modules: false,
        children: false,
        timings: true,
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './public/index.html',
            minify: isDevelopment ? false : {
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                removeEmptyAttributes: true,
                removeStyleLinkTypeAttributes: true,
                keepClosingSlash: true,
                minifyJS: true,
                minifyCSS: true,
                minifyURLs: true,
            },
            inject: true,
        }),
        new webpack.DefinePlugin({
            'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:3311'),
            'process.env.NODE_ENV': JSON.stringify(isDevelopment ? 'development' : 'production'),
        }),
        // Production-only optimizations
        ...(!isDevelopment ? [
            new webpack.ids.HashedModuleIdsPlugin({
                hashDigest: 'hex',
            }),
        ] : []),
    ],
    devServer: {
        historyApiFallback: true,
        port: 3005,
        hot: true,
        client: {
            overlay: {
                errors: true,
                warnings: false
            },
            progress: true, // Show compilation progress
        },
        static: {
            directory: path.join(__dirname, 'public'),
            serveIndex: false,
            watch: false, // Don't watch public folder for changes
        },
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        // Dev server performance
        devMiddleware: {
            stats: 'minimal',
        },
        // Lazy compilation - only compile files when requested
        ...(isDevelopment && {
            liveReload: false,
        }),
    },
    // Snapshot options for better caching
    snapshot: {
        managedPaths: [path.resolve(__dirname, 'node_modules')],
        immutablePaths: [],
        buildDependencies: {
            hash: true,
            timestamp: true,
        },
        module: {
            timestamp: true,
        },
        resolve: {
            timestamp: true,
        },
    },
};
};