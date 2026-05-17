import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(repoRoot, 'public/assets/source/m28')

const STYLE_PROVENANCE =
  'Local authored fallback stand-in using the M2.8 shared style prefix: premium hand-painted 2D storybook arcade pond art, clear silhouettes, soft watercolor texture, no text, logos, or watermark.'

export const M28_FALLBACK_ASSETS = [
  asset('m28-home-pond-background-v1', 1600, 1200, 'opaque', background),
  asset('m28-lily-left-v1', 256, 192, 'transparent', () => lily('left')),
  asset('m28-lily-right-v1', 256, 192, 'transparent', () => lily('right')),
  asset('m28-frog-p1-idle-v1', 256, 256, 'transparent', () => frog('p1', 'idle')),
  asset('m28-frog-p1-crouch-v1', 256, 256, 'transparent', () => frog('p1', 'crouch')),
  asset('m28-frog-p1-airborne-v1', 256, 256, 'transparent', () => frog('p1', 'airborne')),
  asset('m28-frog-p1-tongue-v1', 256, 256, 'transparent', () => frog('p1', 'tongue')),
  asset('m28-frog-p1-splash-v1', 256, 256, 'transparent', () => frog('p1', 'splash')),
  asset('m28-frog-p2-idle-v1', 256, 256, 'transparent', () => frog('p2', 'idle')),
  asset('m28-frog-p2-crouch-v1', 256, 256, 'transparent', () => frog('p2', 'crouch')),
  asset('m28-frog-p2-airborne-v1', 256, 256, 'transparent', () => frog('p2', 'airborne')),
  asset('m28-frog-p2-tongue-v1', 256, 256, 'transparent', () => frog('p2', 'tongue')),
  asset('m28-frog-p2-splash-v1', 256, 256, 'transparent', () => frog('p2', 'splash')),
  asset('m28-fly-wing-a-v1', 96, 96, 'transparent', () => fly('up')),
  asset('m28-fly-wing-b-v1', 96, 96, 'transparent', () => fly('down')),
  asset('m28-firefly-end-v1', 128, 128, 'transparent', fireflyEnd),
  asset('m28-splash-ring-v1', 192, 192, 'transparent', splashRing),
  asset('m28-catch-pop-v1', 128, 128, 'transparent', catchPop),
  asset('m28-tongue-flash-v1', 128, 64, 'transparent', tongueFlash),
  asset('m28-rush-power-v1', 128, 128, 'transparent', rushPower),
  asset('m28-prologue-dawn-v1', 1280, 720, 'opaque', () => prologue('dawn')),
  asset('m28-prologue-day-v1', 1280, 720, 'opaque', () => prologue('day')),
  asset('m28-prologue-dusk-v1', 1280, 720, 'opaque', () => prologue('dusk')),
  asset('m28-ui-star-filled-v1', 96, 96, 'transparent', () => starIcon('filled')),
  asset('m28-ui-star-empty-v1', 96, 96, 'transparent', () => starIcon('empty')),
  asset('m28-ui-lock-v1', 96, 96, 'transparent', lockIcon),
  asset('m28-ui-cleared-v1', 96, 96, 'transparent', clearedIcon),
]

if (process.argv.includes('--check')) {
  checkSources()
} else {
  await renderAssets()
}

function asset(name, width, height, transparency, makeSvg) {
  return {
    name,
    output: `public/assets/m28/${name}.png`,
    source: `public/assets/source/m28/${name}.svg`,
    width,
    height,
    transparency,
    makeSvg,
  }
}

async function renderAssets() {
  writeSources()

  const browser = await chromium.launch({ headless: true })
  try {
    for (const assetDefinition of M28_FALLBACK_ASSETS) {
      await renderAsset(browser, assetDefinition)
      console.log(`wrote ${assetDefinition.output}`)
    }
  } finally {
    await browser.close()
  }
}

function writeSources() {
  fs.mkdirSync(sourceDir, { recursive: true })
  for (const assetDefinition of M28_FALLBACK_ASSETS) {
    const sourcePath = path.join(repoRoot, assetDefinition.source)
    const source = `${assetDefinition.makeSvg(assetDefinition).replace(/[ \t]+$/gm, '')}\n`
    fs.writeFileSync(sourcePath, source, 'utf8')
  }
}

function checkSources() {
  for (const assetDefinition of M28_FALLBACK_ASSETS) {
    const sourcePath = path.join(repoRoot, assetDefinition.source)
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`missing source ${assetDefinition.source}`)
    }
    console.log(`verified source ${assetDefinition.source}`)
  }
}

async function renderAsset(browser, assetDefinition) {
  const sourcePath = path.join(repoRoot, assetDefinition.source)
  const outputPath = path.join(repoRoot, assetDefinition.output)

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })

  const context = await browser.newContext({
    viewport: { width: assetDefinition.width, height: assetDefinition.height },
    deviceScaleFactor: 1,
  })
  await context.route(/^https?:\/\//, (route) => route.abort())

  const page = await context.newPage()
  try {
    await page.goto(pathToFileURL(sourcePath).href)
    await page.screenshot({
      path: outputPath,
      omitBackground: assetDefinition.transparency === 'transparent',
      clip: { x: 0, y: 0, width: assetDefinition.width, height: assetDefinition.height },
    })
  } finally {
    await context.close()
  }
}

function svg(width, height, body, options = {}) {
  const background = options.background ?? ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <defs>
    <filter id="paper" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="28" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0.18" result="softNoise"/>
      <feBlend in="SourceGraphic" in2="softNoise" mode="soft-light"/>
    </filter>
    <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#0b2b35" flood-opacity="0.22"/>
    </filter>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="7" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="water" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#9fddd6"/>
      <stop offset="0.46" stop-color="#4eb2ab"/>
      <stop offset="1" stop-color="#195d70"/>
    </linearGradient>
    <linearGradient id="frogP1" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#dcf879"/>
      <stop offset="0.52" stop-color="#67bf52"/>
      <stop offset="1" stop-color="#1f7f57"/>
    </linearGradient>
    <linearGradient id="frogP2" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#ffe181"/>
      <stop offset="0.5" stop-color="#8fc552"/>
      <stop offset="1" stop-color="#2a825e"/>
    </linearGradient>
    <radialGradient id="gold" cx="45%" cy="35%" r="65%">
      <stop offset="0" stop-color="#fff6a5"/>
      <stop offset="0.52" stop-color="#f1b640"/>
      <stop offset="1" stop-color="#b96e23"/>
    </radialGradient>
  </defs>
  ${background}
  <g filter="url(#paper)">${body}</g>
</svg>`
}

function background() {
  const reeds = Array.from({ length: 26 }, (_, index) => {
    const x = index < 13 ? 18 + index * 18 : 1360 + (index - 13) * 17
    const h = 145 + (index % 5) * 34
    return `<path d="M${x} 980 C${x - 12} ${900 - h / 3}, ${x + 18} ${840 - h / 2}, ${x + (index % 2 ? 36 : -28)} ${760 - h}" stroke="#356f4f" stroke-width="${8 + (index % 3)}" stroke-linecap="round" fill="none"/>`
  }).join('\n')

  const lilyCluster = (x, y, scale, flip = 1) => `<g transform="translate(${x} ${y}) scale(${scale * flip} ${scale})" filter="url(#softShadow)">
    <ellipse cx="0" cy="0" rx="160" ry="82" fill="#4f9d5e" opacity="0.92"/>
    <path d="M-12 -76 C42 -42, 74 -22, 144 -16 C84 16, 40 52, -12 78 C-78 54, -142 26, -160 -12 C-108 -26, -60 -44, -12 -76Z" fill="#76bd69"/>
    <path d="M-10 -68 C18 -18, 42 28, 82 54" stroke="#2f7b57" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.5"/>
    <circle cx="58" cy="-8" r="16" fill="#f7cc7a"/>
  </g>`

  const body = `
    <rect width="1600" height="1200" fill="#b5e0cf"/>
    <rect y="260" width="1600" height="760" fill="url(#water)"/>
    <path d="M0 320 C210 240, 390 324, 590 284 C790 244, 1010 300, 1210 258 C1390 222, 1520 246, 1600 218 L1600 0 L0 0Z" fill="#d1efdb"/>
    <path d="M0 1040 C260 980, 438 1052, 698 1016 C984 978, 1228 1044, 1600 980 L1600 1200 L0 1200Z" fill="#2e795c"/>
    <g opacity="0.24" stroke="#e4fff7" stroke-width="5" fill="none">
      <path d="M120 442 C340 404, 470 454, 674 418 S1038 452, 1260 414 S1500 442, 1578 430"/>
      <path d="M38 620 C286 666, 510 596, 760 644 S1160 670, 1530 620"/>
      <path d="M138 794 C428 754, 662 826, 910 778 S1254 744, 1490 796"/>
    </g>
    <g opacity="0.82">${reeds}</g>
    ${lilyCluster(260, 850, 1.0)}
    ${lilyCluster(1340, 850, 1.0, -1)}
    ${lilyCluster(772, 934, 0.48)}
    <g opacity="0.5">
      <circle cx="1240" cy="332" r="10" fill="#ffe883"/>
      <circle cx="1308" cy="394" r="6" fill="#ffe883"/>
      <circle cx="314" cy="386" r="7" fill="#ffe883"/>
      <circle cx="444" cy="314" r="5" fill="#ffe883"/>
    </g>`
  return svg(1600, 1200, body)
}

function lily(side) {
  const flip = side === 'right' ? -1 : 1
  const body = `<g transform="translate(128 96) scale(${flip} 1)" filter="url(#softShadow)">
    <ellipse cx="0" cy="18" rx="104" ry="54" fill="#224f67" opacity="0.18"/>
    <path d="M-8 -74 C34 -40, 74 -20, 106 -12 C68 8, 44 42, 8 76 C-48 64, -96 32, -104 -10 C-70 -22, -38 -44, -8 -74Z" fill="#72be70"/>
    <path d="M-14 -66 C10 -20, 24 22, 54 54" stroke="#2f7d59" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.5"/>
    <path d="M-88 -8 C-46 -8, -6 -2, 58 20" stroke="#d7f1a0" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.42"/>
    <g transform="translate(44 -8)">
      <circle r="13" fill="#f7ce79"/>
      <circle cx="13" cy="-2" r="7" fill="#ffe7a7"/>
      <circle cx="-9" cy="7" r="6" fill="#f0a96a"/>
    </g>
  </g>`
  return svg(256, 192, body)
}

function frog(player, pose) {
  const isP2 = player === 'p2'
  const palette = isP2 ? 'url(#frogP2)' : 'url(#frogP1)'
  const accent = isP2 ? '#f0b84a' : '#4bd1b1'
  const flip = isP2 ? -1 : 1
  const poseOffsets = {
    idle: { y: 0, bodyY: 0, bodyScaleY: 1, legY: 0, armY: 0, eyeY: 0 },
    crouch: { y: 18, bodyY: 18, bodyScaleY: 0.78, legY: 24, armY: 14, eyeY: 10 },
    airborne: { y: -18, bodyY: -10, bodyScaleY: 1.04, legY: -26, armY: -12, eyeY: -6 },
    tongue: { y: 0, bodyY: 0, bodyScaleY: 1, legY: 0, armY: -4, eyeY: 0 },
    splash: { y: 18, bodyY: 22, bodyScaleY: 0.7, legY: 26, armY: 8, eyeY: 12 },
  }[pose]

  const splash = pose === 'splash'
    ? `<g opacity="0.72" fill="none" stroke="#d6fff9" stroke-linecap="round">
        <path d="M-74 76 C-42 54, 4 54, 50 76" stroke-width="8"/>
        <path d="M-94 50 C-76 30, -58 28, -36 48" stroke-width="6"/>
        <path d="M58 48 C82 28, 100 34, 116 58" stroke-width="6"/>
      </g>`
    : ''

  const tongue = pose === 'tongue'
    ? `<path d="M58 -6 C92 -24, 120 -28, 154 -15" stroke="#ff6f82" stroke-width="14" stroke-linecap="round" fill="none"/>
       <circle cx="158" cy="-14" r="10" fill="#ffd0d7"/>`
    : ''

  const body = `<g transform="translate(128 ${128 + poseOffsets.y}) scale(${flip} 1)" filter="url(#softShadow)">
    ${tongue}
    <ellipse cx="-48" cy="${58 + poseOffsets.legY}" rx="46" ry="20" fill="#245f46" opacity="0.46"/>
    <ellipse cx="38" cy="${60 + poseOffsets.legY}" rx="50" ry="21" fill="#245f46" opacity="0.42"/>
    <ellipse cx="0" cy="${20 + poseOffsets.bodyY}" rx="62" ry="${54 * poseOffsets.bodyScaleY}" fill="${palette}"/>
    <ellipse cx="18" cy="${4 + poseOffsets.bodyY}" rx="45" ry="${33 * poseOffsets.bodyScaleY}" fill="#ecf7a7" opacity="0.58"/>
    <circle cx="-31" cy="${-34 + poseOffsets.eyeY}" r="25" fill="${palette}"/>
    <circle cx="28" cy="${-34 + poseOffsets.eyeY}" r="25" fill="${palette}"/>
    <circle cx="-26" cy="${-39 + poseOffsets.eyeY}" r="11" fill="#fffef0"/>
    <circle cx="35" cy="${-39 + poseOffsets.eyeY}" r="11" fill="#fffef0"/>
    <circle cx="-22" cy="${-39 + poseOffsets.eyeY}" r="5" fill="#183034"/>
    <circle cx="39" cy="${-39 + poseOffsets.eyeY}" r="5" fill="#183034"/>
    <path d="M-28 ${16 + poseOffsets.bodyY} C-4 ${32 + poseOffsets.bodyY}, 24 ${30 + poseOffsets.bodyY}, 44 ${12 + poseOffsets.bodyY}" stroke="#1d584b" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.58"/>
    <ellipse cx="-48" cy="${34 + poseOffsets.armY}" rx="18" ry="10" fill="${accent}" transform="rotate(-20 -48 ${34 + poseOffsets.armY})" opacity="0.9"/>
    <ellipse cx="52" cy="${34 + poseOffsets.armY}" rx="20" ry="10" fill="${accent}" transform="rotate(22 52 ${34 + poseOffsets.armY})" opacity="0.82"/>
    <circle cx="-26" cy="${8 + poseOffsets.bodyY}" r="5" fill="#f7ffe0" opacity="0.45"/>
    <circle cx="12" cy="${36 + poseOffsets.bodyY}" r="4" fill="#f7ffe0" opacity="0.35"/>
    ${splash}
  </g>`
  return svg(256, 256, body)
}

function fly(frame) {
  const wingA = frame === 'up' ? '-26 -30 34 18' : '-26 -8 34 22'
  const wingB = frame === 'up' ? '12 -32 36 20' : '12 -6 36 22'
  const body = `<g transform="translate(48 48)" filter="url(#softShadow)">
    <ellipse cx="${wingA.split(' ')[0]}" cy="${wingA.split(' ')[1]}" rx="${wingA.split(' ')[2]}" ry="${wingA.split(' ')[3]}" fill="#dff7ff" opacity="0.72" transform="rotate(-24)"/>
    <ellipse cx="${wingB.split(' ')[0]}" cy="${wingB.split(' ')[1]}" rx="${wingB.split(' ')[2]}" ry="${wingB.split(' ')[3]}" fill="#e9fbff" opacity="0.72" transform="rotate(24)"/>
    <ellipse cx="0" cy="10" rx="30" ry="21" fill="#293941"/>
    <ellipse cx="-12" cy="5" rx="14" ry="18" fill="#4c5a61"/>
    <circle cx="22" cy="4" r="13" fill="#6d343c"/>
    <circle cx="26" cy="0" r="5" fill="#ffd1d1"/>
    <path d="M-16 27 L-28 38 M2 30 L-4 43 M18 26 L28 38" stroke="#202a2f" stroke-width="4" stroke-linecap="round"/>
  </g>`
  return svg(96, 96, body)
}

function fireflyEnd() {
  const body = `<g transform="translate(64 64)" filter="url(#glow)">
    <circle r="50" fill="#ffe777" opacity="0.18"/>
    <ellipse cx="-22" cy="-14" rx="26" ry="13" fill="#d7fff1" opacity="0.56" transform="rotate(-28)"/>
    <ellipse cx="22" cy="-14" rx="26" ry="13" fill="#d7fff1" opacity="0.56" transform="rotate(28)"/>
    <ellipse cx="0" cy="10" rx="22" ry="30" fill="url(#gold)"/>
    <circle cx="-7" cy="-8" r="5" fill="#fff8c7"/>
    <circle cx="8" cy="-8" r="5" fill="#fff8c7"/>
    <path d="M-14 22 C0 34, 18 26, 22 8" stroke="#8f5522" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>`
  return svg(128, 128, body)
}

function splashRing() {
  const body = `<g transform="translate(96 96)" fill="none" stroke-linecap="round">
    <ellipse rx="72" ry="34" stroke="#d9fff8" stroke-width="12" opacity="0.68"/>
    <ellipse rx="48" ry="22" stroke="#93d9d7" stroke-width="8" opacity="0.52"/>
    <path d="M-78 -18 C-92 -42, -54 -52, -44 -26" stroke="#effffc" stroke-width="8" opacity="0.8"/>
    <path d="M62 -14 C78 -42, 104 -18, 84 8" stroke="#effffc" stroke-width="7" opacity="0.74"/>
    <path d="M-42 22 C-16 38, 22 38, 50 18" stroke="#baf0e9" stroke-width="6" opacity="0.62"/>
  </g>`
  return svg(192, 192, body)
}

function catchPop() {
  const rays = Array.from({ length: 10 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 10
    const x1 = 64 + Math.cos(angle) * 23
    const y1 = 64 + Math.sin(angle) * 23
    const x2 = 64 + Math.cos(angle) * 54
    const y2 = 64 + Math.sin(angle) * 54
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#fff0a2" stroke-width="7" stroke-linecap="round"/>`
  }).join('\n')
  const body = `<g filter="url(#glow)">
    ${rays}
    <circle cx="64" cy="64" r="28" fill="#ffd45c" opacity="0.86"/>
    <circle cx="56" cy="56" r="10" fill="#fff4c8" opacity="0.9"/>
  </g>`
  return svg(128, 128, body)
}

function tongueFlash() {
  const body = `<g transform="translate(8 10)" filter="url(#glow)">
    <path d="M6 22 C36 2, 80 0, 112 16 C86 24, 54 38, 12 42Z" fill="#ff6f82" opacity="0.86"/>
    <path d="M20 25 C50 10, 82 10, 104 18" stroke="#ffd2d8" stroke-width="7" stroke-linecap="round" opacity="0.82"/>
  </g>`
  return svg(128, 64, body)
}

function rushPower() {
  const body = `<g transform="translate(64 64)" filter="url(#glow)">
    <circle r="48" fill="#ffe57d" opacity="0.23"/>
    <circle r="32" fill="url(#gold)"/>
    <path d="M2 -36 L-18 4 L4 4 L-6 38 L28 -10 L8 -10 Z" fill="#fff7a8" stroke="#9c5a1e" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="-15" cy="-14" r="5" fill="#fffbd1" opacity="0.8"/>
  </g>`
  return svg(128, 128, body)
}

function prologue(tone) {
  const toneConfig = {
    dawn: ['#f7c58e', '#79c8c6', '#2b7d78', '#fff1ae'],
    day: ['#a8e6cf', '#54b6b3', '#267389', '#fff6a7'],
    dusk: ['#7b5e9f', '#3d668f', '#173e55', '#ffc977'],
  }[tone]
  const [sky, water, deep, light] = toneConfig
  const body = `
    <rect width="1280" height="720" fill="${sky}"/>
    <path d="M0 160 C170 108, 324 178, 500 132 C700 80, 890 158, 1060 118 C1160 94, 1230 102, 1280 86 L1280 0 L0 0Z" fill="#d9f0cc" opacity="0.82"/>
    <rect y="230" width="1280" height="360" fill="${water}"/>
    <path d="M0 590 C170 542, 300 612, 480 576 C704 530, 910 604, 1280 550 L1280 720 L0 720Z" fill="${deep}"/>
    <g opacity="0.28" stroke="#f0fffb" stroke-width="4" fill="none">
      <path d="M80 306 C230 286, 390 318, 560 298 S910 322, 1200 292"/>
      <path d="M44 420 C280 456, 510 394, 770 432 S1030 456, 1238 418"/>
    </g>
    <g transform="translate(222 458)" filter="url(#softShadow)">
      <ellipse rx="120" ry="50" fill="#5eb469"/>
      <path d="M-18 -44 C32 -18, 70 -10, 104 -6 C76 16, 38 44, -12 52 C-62 38, -104 18, -120 -12 C-80 -18, -44 -26, -18 -44Z" fill="#80c976"/>
    </g>
    <g transform="translate(1010 462) scale(-1 1)" filter="url(#softShadow)">
      <ellipse rx="120" ry="50" fill="#5eb469"/>
      <path d="M-18 -44 C32 -18, 70 -10, 104 -6 C76 16, 38 44, -12 52 C-62 38, -104 18, -120 -12 C-80 -18, -44 -26, -18 -44Z" fill="#80c976"/>
    </g>
    <circle cx="1070" cy="132" r="42" fill="${light}" opacity="0.9"/>
    <g opacity="0.72">
      <circle cx="745" cy="278" r="6" fill="${light}"/>
      <circle cx="810" cy="242" r="4" fill="${light}"/>
      <circle cx="930" cy="316" r="5" fill="${light}"/>
    </g>`
  return svg(1280, 720, body)
}

function starIcon(mode) {
  const fill = mode === 'filled' ? 'url(#gold)' : 'none'
  const opacity = mode === 'filled' ? '1' : '0.42'
  const body = `<g transform="translate(48 49)" filter="url(#softShadow)">
    <path d="M0 -38 L11 -12 L39 -10 L18 8 L25 36 L0 20 L-25 36 L-18 8 L-39 -10 L-11 -12Z" fill="${fill}" stroke="#f5cf65" stroke-width="7" stroke-linejoin="round" opacity="${opacity}"/>
    ${mode === 'filled' ? '<path d="M-8 -18 L0 -28 L8 -12 L24 -10 L10 3" stroke="#fff5b4" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.8"/>' : ''}
  </g>`
  return svg(96, 96, body)
}

function lockIcon() {
  const body = `<g transform="translate(48 50)" filter="url(#softShadow)">
    <path d="M-22 -6 L-22 -20 C-22 -43, 22 -43, 22 -20 L22 -6" fill="none" stroke="#d6f0e9" stroke-width="10" stroke-linecap="round"/>
    <rect x="-34" y="-8" width="68" height="52" rx="13" fill="#436c75"/>
    <circle cy="14" r="8" fill="#f2d46d"/>
    <path d="M0 21 L0 33" stroke="#f2d46d" stroke-width="6" stroke-linecap="round"/>
  </g>`
  return svg(96, 96, body)
}

function clearedIcon() {
  const body = `<g transform="translate(48 48)" filter="url(#softShadow)">
    <circle r="38" fill="#4fab79"/>
    <path d="M-20 0 L-6 17 L25 -20" stroke="#f8fff3" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M-24 -25 C-6 -38, 20 -36, 31 -18" stroke="#b6f6c5" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.72"/>
  </g>`
  return svg(96, 96, body)
}

export { STYLE_PROVENANCE }
