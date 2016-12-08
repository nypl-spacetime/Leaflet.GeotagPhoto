import babel from 'rollup-plugin-babel'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  entry: 'index.js',
  dest: 'dist/Leaflet.GeotagPhoto.js',
  format: 'iife',
  moduleName: 'leaflet-geotag-photo',
  globals: {
    Leaflet: 'L'
  },
  plugins: [
    nodeResolve({
      jsnext: true,
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
