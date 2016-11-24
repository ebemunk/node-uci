const webpack = require('webpack')

module.exports = {
	entry: {
		app: [
			'./src',
		]
	},
	resolve: {
		extensions: ['.js'],
	},
	output: {
		path: './lib',
		filename: 'index-webpack.js',
		library: 'node-uci',
		libraryTarget:'umd'
	},
	devtool: 'cheap-source-map',
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /(node_modules)/,
				use: 'babel-loader',
			}
		]
	},
	externals: {
		child_process: {
			amd: 'child_process',
			commonjs: 'child_process',
			commonjs2: 'child_process',
		},
		path: {
			amd: 'path',
			commonjs: 'path',
			commonjs2: 'path',
		},
		os: {
			amd: 'os',
			commonjs: 'os',
			commonjs2: 'os',
		},
		events: {
			amd: 'events',
			commonjs: 'events',
			commonjs2: 'events',
		},
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify('production')
			}
		}),
		new webpack.optimize.UglifyJsPlugin({
			comments: false
		})
	]
}
