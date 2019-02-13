import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import url from 'rollup-plugin-url'
import svgr from '@svgr/rollup'
import multiEntry from 'rollup-plugin-multi-entry'
import pkg from './package.json'

export default {
  input: ['src/index.js','src/HermodReactSatellite.js','src/HermodLogger.js','HermodReactComponent.js','HermodReactConfig.js','HermodReactFlatLogger.js','HermodReactHotwordServer.js','HermodReactLogger.js','HermodReactMicrophone.js','HermodReactSpeaker.js','HermodReactTts.js','loggingEventFunctions.js'],
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: [
    multiEntry(),
    external(),
    postcss({
      modules: true
    }),
    url(),
    svgr(),
    babel({
      exclude: 'node_modules/**',
      plugins: [ 'external-helpers' ]
    }),
    resolve(),
    commonjs()
  ]
}
