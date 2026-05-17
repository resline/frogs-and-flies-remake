import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
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

export const M28_AUDIO_ASSETS = [
  'public/audio/sfx/jump.mp3',
  'public/audio/sfx/tongue.mp3',
  'public/audio/sfx/catch.mp3',
  'public/audio/sfx/miss.mp3',
  'public/audio/sfx/splash.mp3',
  'public/audio/sfx/power.mp3',
  'public/audio/sfx/start.mp3',
  'public/audio/sfx/pause.mp3',
  'public/audio/sfx/results.mp3',
  'public/audio/music/home-pond-loop.mp3',
]

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isCli) {
  if (process.argv.includes('--images')) {
    checkImages()
  } else if (process.argv.includes('--audio')) {
    checkAudio()
  } else if (process.argv.includes('--parity')) {
    checkParity()
  } else {
    console.error('Usage: node scripts/check-m28-assets.mjs --images | --audio | --parity')
    process.exitCode = 1
  }
}

function checkImages(options = {}) {
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

    if (!options.silent) {
      console.log(`verified ${asset.output} ${asset.width}x${asset.height} ${asset.transparency}`)
    }
  }
}

function checkAudio(options = {}) {
  const manifestPath = path.join(repoRoot, 'ASSET_MANIFEST.md')
  const manifest = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : ''

  for (const output of M28_AUDIO_ASSETS) {
    const outputPath = path.join(repoRoot, output)
    if (!fs.existsSync(outputPath)) {
      throw new Error(`missing audio output ${output}`)
    }

    const bytes = fs.readFileSync(outputPath)
    if (bytes.length <= 256) {
      throw new Error(`${output} expected >256 bytes, got ${bytes.length}`)
    }

    if (!isLikelyMp3(bytes)) {
      throw new Error(`${output} does not look like an MP3 file`)
    }

    if (!manifest.includes(output)) {
      throw new Error(`${output} missing ASSET_MANIFEST.md provenance`)
    }

    const duration = getAudioDurationSeconds(outputPath)
    const durationLabel = duration === undefined ? 'duration unavailable' : `${duration.toFixed(2)}s`
    if (!options.silent) {
      console.log(`verified ${output} ${bytes.length} bytes ${durationLabel}`)
    }
  }
}

function checkParity() {
  checkImages({ silent: true })
  checkAudio({ silent: true })

  const requiredImageUrls = M28_IMAGE_ASSETS.map((asset) => publicOutputToUrl(asset.output))
  const requiredAudioUrls = M28_AUDIO_ASSETS.map(publicOutputToUrl)
  const requiredUrls = [...requiredImageUrls, ...requiredAudioUrls]
  const assetsSource = readRepoFile('src/runtime/assets.ts')
  const audioSource = readRepoFile('src/runtime/audio.ts')
  const pwaSource = readRepoFile('src/runtime/pwa.ts')
  const serviceWorkerSource = readRepoFile('public/service-worker.js')

  assertSameSet(
    'runtime M2.8 visual asset paths',
    extractQuotedPaths(assetsSource, /^\/assets\/m28\/.+\.png$/),
    requiredImageUrls,
  )
  assertSameSet('runtime local audio asset paths', extractQuotedPaths(audioSource, /^\/audio\/.+\.mp3$/), requiredAudioUrls)

  for (const path of requiredUrls) {
    if (!pwaSourceIncludesM28Registry(pwaSource, path)) {
      throw new Error(`${path} missing from TypeScript PWA cache contract`)
    }
  }

  const pwaCacheName = extractCacheName(pwaSource, /export const PWA_CACHE_NAME = '([^']+)'/)
  const serviceWorkerCacheName = extractCacheName(serviceWorkerSource, /const PWA_CACHE_NAME = '([^']+)'/)
  if (pwaCacheName !== serviceWorkerCacheName) {
    throw new Error(`PWA cache name mismatch: TypeScript ${pwaCacheName}, service worker ${serviceWorkerCacheName}`)
  }

  const serviceWorkerCacheUrls = extractServiceWorkerCacheUrls(serviceWorkerSource)
  for (const path of requiredUrls) {
    if (!serviceWorkerCacheUrls.includes(path)) {
      throw new Error(`${path} missing from service worker APP_SHELL_CACHE_URLS`)
    }
  }

  for (const path of serviceWorkerCacheUrls) {
    assertCacheUrlExists(path)
  }

  console.log(`verified parity for ${requiredImageUrls.length} images, ${requiredAudioUrls.length} audio files`)
}

function isLikelyMp3(bytes) {
  const hasId3Header = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33
  const hasMpegFrameSync = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0
  return hasId3Header || hasMpegFrameSync
}

function getAudioDurationSeconds(outputPath) {
  const probe = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', outputPath],
    { encoding: 'utf8' },
  )

  if (probe.status !== 0) {
    return undefined
  }

  const duration = Number.parseFloat(probe.stdout.trim())
  return Number.isFinite(duration) ? duration : undefined
}

function publicOutputToUrl(output) {
  if (!output.startsWith('public/')) {
    throw new Error(`${output} expected public/ prefix`)
  }
  return `/${output.slice('public/'.length)}`
}

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function extractQuotedPaths(source, matcher) {
  return [...source.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]).filter((value) => matcher.test(value))
}

function assertSameSet(label, actual, expected) {
  const actualSet = new Set(actual)
  const expectedSet = new Set(expected)

  for (const value of expectedSet) {
    if (!actualSet.has(value)) {
      throw new Error(`${label} missing ${value}`)
    }
  }

  for (const value of actualSet) {
    if (!expectedSet.has(value)) {
      throw new Error(`${label} has unexpected ${value}`)
    }
  }
}

function pwaSourceIncludesM28Registry(source, requiredPath) {
  if (requiredPath.startsWith('/assets/m28/')) {
    return source.includes('M28_REQUIRED_VISUAL_ASSET_PATHS')
  }

  if (requiredPath.startsWith('/audio/')) {
    return source.includes('LOCAL_AUDIO_ASSET_REGISTRY')
  }

  return source.includes(requiredPath)
}

function extractCacheName(source, pattern) {
  const match = source.match(pattern)
  if (!match?.[1]) {
    throw new Error('missing PWA cache name')
  }
  return match[1]
}

function extractServiceWorkerCacheUrls(source) {
  const match = source.match(/const APP_SHELL_CACHE_URLS = \[([\s\S]*?)\]/)
  if (!match?.[1]) {
    throw new Error('missing APP_SHELL_CACHE_URLS')
  }
  return extractQuotedPaths(match[1], /^\//)
}

function assertCacheUrlExists(urlPath) {
  if (urlPath === '/') {
    return
  }

  const publicPath = path.join(repoRoot, 'public', urlPath)
  if (!fs.existsSync(publicPath)) {
    throw new Error(`service worker cache URL ${urlPath} points to missing ${path.relative(repoRoot, publicPath)}`)
  }
}
