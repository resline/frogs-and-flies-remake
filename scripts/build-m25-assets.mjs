import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { PNG } from 'pngjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const M25_ASSETS = [
  {
    output: 'public/assets/home-pond-background.png',
    source: 'public/assets/source/m25/home-pond-background.svg',
    width: 1600,
    height: 1200,
    transparency: 'opaque',
  },
  { output: 'public/assets/lily-left.png', source: 'public/assets/source/m25/lily-left.svg', width: 256, height: 192, transparency: 'transparent' },
  { output: 'public/assets/lily-right.png', source: 'public/assets/source/m25/lily-right.svg', width: 256, height: 192, transparency: 'transparent' },
  { output: 'public/assets/frog-p1-idle.png', source: 'public/assets/source/m25/frog-p1-idle.svg', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/frog-p1-crouch.png', source: 'public/assets/source/m25/frog-p1-crouch.svg', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/frog-p1-airborne.png', source: 'public/assets/source/m25/frog-p1-airborne.svg', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/frog-p1-tongue.png', source: 'public/assets/source/m25/frog-p1-tongue.svg', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/frog-p1-splash.png', source: 'public/assets/source/m25/frog-p1-splash.svg', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/frog-p2-idle.png', source: 'public/assets/source/m25/frog-p2-idle.svg', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/frog-p2-crouch.png', source: 'public/assets/source/m25/frog-p2-crouch.svg', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/frog-p2-airborne.png', source: 'public/assets/source/m25/frog-p2-airborne.svg', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/frog-p2-tongue.png', source: 'public/assets/source/m25/frog-p2-tongue.svg', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/frog-p2-splash.png', source: 'public/assets/source/m25/frog-p2-splash.svg', width: 256, height: 256, transparency: 'transparent' },
  { output: 'public/assets/fly-wing-a.png', source: 'public/assets/source/m25/fly-wing-a.svg', width: 96, height: 96, transparency: 'transparent' },
  { output: 'public/assets/fly-wing-b.png', source: 'public/assets/source/m25/fly-wing-b.svg', width: 96, height: 96, transparency: 'transparent' },
  { output: 'public/assets/firefly-end.png', source: 'public/assets/source/m25/firefly-end.svg', width: 128, height: 128, transparency: 'transparent' },
  { output: 'public/assets/splash-ring.png', source: 'public/assets/source/m25/splash-ring.svg', width: 192, height: 192, transparency: 'transparent' },
  { output: 'public/assets/catch-pop.png', source: 'public/assets/source/m25/catch-pop.svg', width: 128, height: 128, transparency: 'transparent' },
  { output: 'public/assets/tongue-flash.png', source: 'public/assets/source/m25/tongue-flash.svg', width: 128, height: 64, transparency: 'transparent' },
]

const checkOnly = process.argv.includes('--check')

if (checkOnly) {
  checkAssets()
} else {
  await renderAssets()
}

async function renderAssets() {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const asset of M25_ASSETS) {
      await renderAsset(browser, asset)
      console.log(`wrote ${asset.output}`)
    }
  } finally {
    await browser.close()
  }
}

async function renderAsset(browser, asset) {
  const sourcePath = path.join(repoRoot, asset.source)
  const outputPath = path.join(repoRoot, asset.output)

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`missing source ${asset.source}`)
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })

  const context = await browser.newContext({
    viewport: { width: asset.width, height: asset.height },
    deviceScaleFactor: 1,
  })
  await context.route(/^https?:\/\//, (route) => route.abort())

  const page = await context.newPage()
  try {
    await page.goto(pathToFileURL(sourcePath).href)
    await page.screenshot({
      path: outputPath,
      omitBackground: asset.transparency === 'transparent',
      clip: { x: 0, y: 0, width: asset.width, height: asset.height },
    })
  } finally {
    await context.close()
  }
}

function checkAssets() {
  const manifestPath = path.join(repoRoot, 'ASSET_MANIFEST.md')
  const manifest = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : ''
  const shouldCheckManifest = manifest.includes('M2.5')

  for (const asset of M25_ASSETS) {
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

    if (shouldCheckManifest && (!manifest.includes(asset.output) || !manifest.includes(asset.source))) {
      throw new Error(`${asset.output} missing ASSET_MANIFEST.md provenance`)
    }

    console.log(`verified ${asset.output} ${asset.width}x${asset.height} ${asset.transparency}`)
  }

  if (shouldCheckManifest && !manifest.includes('No live OpenAI API calls were made during M2.5 implementation.')) {
    throw new Error('ASSET_MANIFEST.md missing no-live-API note')
  }
}
