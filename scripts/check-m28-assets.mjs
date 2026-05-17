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
  } else {
    console.error('Usage: node scripts/check-m28-assets.mjs --images | --audio')
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

function checkAudio() {
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
    console.log(`verified ${output} ${bytes.length} bytes ${durationLabel}`)
  }
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
