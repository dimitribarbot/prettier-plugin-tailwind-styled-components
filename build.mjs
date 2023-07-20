import esbuild from 'esbuild'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let context = await esbuild.context({
  entryPoints: [path.resolve(__dirname, './src/index.js')],
  outfile: path.resolve(__dirname, './dist/index.js'),
  bundle: true,
  platform: 'node',
  target: 'node12.13.0',
  external: ['prettier'],
  minify: process.argv.includes('--minify'),
  plugins: [],
})

await context.rebuild()

if (process.argv.includes('--watch')) {
  await context.watch()
}

await context.dispose()