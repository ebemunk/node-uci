import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import uglify from 'rollup-plugin-uglify'

const pkg = require('./package.json')
// const external = Object.keys(pkg.dependencies)

export default {
	entry: 'src/index.js',
	plugins: [
		babel({
			runtimeHelpers: true,
			exclude: 'node_modules/**',
		}),
		nodeResolve({
			jsnext: true,
			main: true
		}),
		commonjs({
			include: 'node_modules/**',
		}),
		uglify()
	],
	external: [
		'child_process',
		'path',
		'os',
		'events'
	],
	targets: [
		{
			dest: pkg['main'],
			format: 'umd',
			moduleName: 'uci',
			sourceMap: true
		}
	]
}
