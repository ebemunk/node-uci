import babel from 'rollup-plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
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
      preferBuiltins: true,
    }),
    commonjs({
      include: 'node_modules/**',
    }),
    terser(),
  ],
  external: [
    'child_process',
    'path',
    'os',
    'events',
    'tty',
    'util',
    'async_hooks',
  ],
  output: {
    file: pkg['main'],
    format: 'cjs',
    sourceMap: true,
  },
}
