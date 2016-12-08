import babel from 'rollup-plugin-babel'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  entry: 'Leaflet.GeotagPhoto.js',
  dest: 'dist/Leaflet.GeotagPhoto.js',
  format: 'iife',
  moduleName: 'fieldOfView',
  globals: {
    Leaflet: 'L'
  },
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true,
      browser: true,
      skip: [
        'Leaflet'
      ]
    }),
    commonjs(),
    babel({
      exclude: 'node_modules/**',
      presets: 'es2015-rollup'
    })
  ]
}
