import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

const pkg = require('./package.json')

export default {
  input: 'src/index.js',
  plugins: [
    babel({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
    }),
    nodeResolve({
      jsnext: true,
      main: true,
    }),
    commonjs({
      include: 'node_modules/**',
    }),
    terser(),
  ],
  external: ['child_process', 'path', 'os', 'events', 'tty', 'util'],
  output: {
    file: pkg['main'],
    format: 'cjs',
    sourceMap: true,
  },
}
