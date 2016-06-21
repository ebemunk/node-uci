require('babel-core/register')

import webpack from 'webpack'

let config = {
	module: {
		loaders: [
			{
				test: /.js$/,
				exclude: /node_modules/,
				loader: 'babel'
			}
		]
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env': {
				'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
			}
		})
	]
}

if( process.env.NODE_ENV === 'production' ) {
	config.plugins.push(
		new webpack.optimize.UglifyJsPlugin({
			compressor: {
				warnings: false,
				screw_ie8: true
			},
			comments: false
		})
	)
}

export default config
