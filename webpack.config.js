var webpack = require('webpack');

module.exports = {
    context: __dirname + '/src',
    entry: {
        app: './main'
    },
    output: {
        path: __dirname + '/dist',
        filename: 'main.js',
        libraryTarget: 'var',
        library: 'main'
    },
    module: {
        loaders: [
            {test: /\.json$/, loader: 'json'},
            //{test: /\.html$/, loader: 'html'},
            {test: /\.css$/, loader: 'style!css'},
            {test: /\.styl(us)?$/, loader: 'style!css!stylus'},
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel',
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },
    resolve: {
        modulesDirectories: ['node_modules']
    },
    plugins: [
    ],
    devtool: 'source-map',
    watchDelay: 400,
    node: {
        fs: 'empty'
    }
}
