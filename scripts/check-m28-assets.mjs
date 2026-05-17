import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const M28_IMAGE_ASSETS = [
  {
    output: 'public/assets/m28/m28-home-pond-background-v1.png',
    width: 1600,
    height: 1200,
    transparency: 'opaque',
  },
  { output: 'public/assets/m28/m28-lily-left-v1.png', width: 256, height: 192, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-lily-right-v1.png', width: 256, height: 192, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-frog-p1-idle-v1.png', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-frog-p1-crouch-v1.png', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-frog-p1-airborne-v1.png', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-frog-p1-tongue-v1.png', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-frog-p1-splash-v1.png', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-frog-p2-idle-v1.png', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-frog-p2-crouch-v1.png', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-frog-p2-airborne-v1.png', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-frog-p2-tongue-v1.png', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-frog-p2-splash-v1.png', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-fly-wing-a-v1.png', width: 96, height: 96, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-fly-wing-b-v1.png', width: 96, height: 96, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-firefly-end-v1.png', width: 128, height: 128, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-splash-ring-v1.png', width: 192, height: 192, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-catch-pop-v1.png', width: 128, height: 128, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-tongue-flash-v1.png', width: 128, height: 64, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-rush-power-v1.png', width: 128, height: 128, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-prologue-dawn-v1.png', width: 1280, height: 720, transparency: 'opaque' },
  { output: 'public/assets/m28/m28-prologue-day-v1.png', width: 1280, height: 720, transparency: 'opaque' },
  { output: 'public/assets/m28/m28-prologue-dusk-v1.png', width: 1280, height: 720, transparency: 'opaque' },
  { output: 'public/assets/m28/m28-ui-star-filled-v1.png', width: 96, height: 96, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-ui-star-empty-v1.png', width: 96, height: 96, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-ui-lock-v1.png', width: 96, height: 96, transparency: 'transparent' },
  { output: 'public/assets/m28/m28-ui-cleared-v1.png', width: 96, height: 96, transparency: 'transparent' },
]

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isCli) {
  if (process.argv.includes('--images')) {
    checkImages()
  } else {
    console.error('Usage: node scripts/check-m28-assets.mjs --images')
    process.exitCode = 1
  }
}

function checkImages() {
  const manifestPath = path.join(repoRoot, 'ASSET_MANIFEST.md')
  const manifest = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : ''

  for (const asset of M28_IMAGE_ASSETS) {
    const outputPath = path.join(repoRoot, asset.output)
    if (!fs.existsSync(outputPath)) {
      throw new Error(`missing output ${asset.output}`)
    }

    const png = PNG.sync.read(fs.readFileSync(outputPath))
    if (png.width !== asset.width || png.height !== asset.height) {
      throw new Error(`${asset.output} expected ${asset.width}x${asset.height}, got ${png.width}x${png.height}`)
    }

    let transparentPixels = 0
    for (let index = 3; index < png.data.length; index += 4) {
      if (png.data[index] < 255) {
        transparentPixels += 1
      }
    }

    if (asset.transparency === 'opaque' && transparentPixels > 0) {
      throw new Error(`${asset.output} expected opaque, found ${transparentPixels} transparent pixels`)
    }

    if (asset.transparency === 'transparent' && transparentPixels === 0) {
      throw new Error(`${asset.output} expected transparent pixels`)
    }

    if (!manifest.includes(asset.output)) {
      throw new Error(`${asset.output} missing ASSET_MANIFEST.md provenance`)
    }

    console.log(`verified ${asset.output} ${asset.width}x${asset.height} ${asset.transparency}`)
  }
}
