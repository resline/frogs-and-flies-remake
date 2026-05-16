import { describe, expect, it } from 'vitest'
import { GENERATED_GAMEPLAY_ASSET_PATHS } from '../../src/runtime/assets'
import { LOCAL_AUDIO_ASSET_REGISTRY } from '../../src/runtime/audio'
import { PWA_CACHE_NAME, buildPwaCacheUrls, isSameOriginPwaUrl } from '../../src/runtime/pwa'

describe('PWA cache contract', () => {
  it('uses an M2.6 cache version', () => {
    expect(PWA_CACHE_NAME).toContain('m26')
  })

  it('includes the shell, manifest, and required Home Pond assets', () => {
    const urls = buildPwaCacheUrls()

    expect(urls).toEqual(expect.arrayContaining(['/', '/manifest.webmanifest', ...GENERATED_GAMEPLAY_ASSET_PATHS]))
  })

  it('includes optional audio paths only when the files are present', () => {
    const jumpPath = LOCAL_AUDIO_ASSET_REGISTRY.sfx.jump?.[0]
    const loopPath = LOCAL_AUDIO_ASSET_REGISTRY.music.homePondLoop?.[0]

    expect(jumpPath).toBeDefined()
    expect(loopPath).toBeDefined()

    expect(buildPwaCacheUrls({ availablePaths: new Set(['/']) })).not.toEqual(expect.arrayContaining([jumpPath, loopPath]))
    expect(buildPwaCacheUrls({ availablePaths: new Set([jumpPath as string]) })).toEqual(expect.arrayContaining([jumpPath]))
    expect(buildPwaCacheUrls({ availablePaths: new Set([loopPath as string]) })).toEqual(expect.arrayContaining([loopPath]))
  })

  it('rejects cross-origin cache URLs', () => {
    expect(isSameOriginPwaUrl('/assets/frog-p1-idle.png', 'https://example.test')).toBe(true)
    expect(isSameOriginPwaUrl('https://example.test/assets/frog-p1-idle.png', 'https://example.test')).toBe(true)
    expect(isSameOriginPwaUrl('https://cdn.example.test/frog-p1-idle.png', 'https://example.test')).toBe(false)
  })
})
