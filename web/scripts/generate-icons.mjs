// Renders the PNG icons from the SVG artwork in public/: the home-screen and
// manifest icons for the suite and the per-app apple-touch icons. Output is
// gitignored; `npm run dev` and `npm run build` regenerate it.
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')

async function render(svgFile, outFile, size) {
  const svg = await readFile(svgFile)
  await writeFile(outFile, await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer())
}

await render(path.join(publicDir, 'icon.svg'), path.join(publicDir, 'apple-icon.png'), 180)
await render(path.join(publicDir, 'icon.svg'), path.join(publicDir, 'icon-192.png'), 192)
await render(path.join(publicDir, 'icon.svg'), path.join(publicDir, 'icon-512.png'), 512)

const iconsDir = path.join(publicDir, 'icons')
for (const file of await readdir(iconsDir)) {
  if (!file.endsWith('.svg')) continue
  const app = file.slice(0, -'.svg'.length)
  await render(path.join(iconsDir, file), path.join(iconsDir, `${app}-apple.png`), 180)
}
