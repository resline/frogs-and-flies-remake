import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { GENERATED_GAMEPLAY_ASSET_PATHS } from '../../src/runtime/assets'
import { LOCAL_AUDIO_ASSET_REGISTRY } from '../../src/runtime/audio'
import { PWA_CACHE_NAME, buildPwaCacheUrls, collectPwaRuntimeAssetUrls, isSameOriginPwaUrl } from '../../src/runtime/pwa'

interface ServiceWorkerPolicyContext {
  caches?: {
    match: (request: Request, options?: CacheQueryOptions) => Promise<Response | undefined>
  }
  cacheFirst?: (request: Request) => Promise<Response>
  self: {
    addEventListener: () => void
    location: { origin: string }
  }
  isRuntimeCacheableRequest?: (request: Request, url: URL) => boolean
}

function loadServiceWorkerPolicy(overrides: Partial<ServiceWorkerPolicyContext> = {}): ServiceWorkerPolicyContext {
  const source = readFileSync(new URL('../../public/service-worker.js', import.meta.url), 'utf8')
  const context: ServiceWorkerPolicyContext = {
    self: {
      addEventListener: () => undefined,
      location: { origin: 'https://game.example' },
    },
    ...overrides,
  }

  vm.createContext(context)
  vm.runInContext(source, context)
  return context
}

function requestWithDestination(destination: RequestDestination): Request {
  return { destination } as Request
}

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

  it('collects same-origin runtime scripts, styles, and modulepreloads for cache warming', () => {
    const elementAttributes = [
      { src: '/assets/index-abc123.js' },
      { href: '/assets/index-abc123.css' },
      { href: '/assets/vendor-abc123.js' },
      { src: 'https://cdn.example/index.js' },
      { src: '/assets/index-abc123.js' },
    ]
    const root = {
      querySelectorAll: () =>
        elementAttributes.map((attributes) => ({
          getAttribute: (name: string) => attributes[name as keyof typeof attributes] ?? null,
        })),
    } as unknown as ParentNode

    expect(collectPwaRuntimeAssetUrls(root, 'https://game.example')).toEqual([
      'https://game.example/assets/index-abc123.js',
      'https://game.example/assets/index-abc123.css',
      'https://game.example/assets/vendor-abc123.js',
    ])
  })

  it('runtime caches same-origin built scripts, styles, and modulepreloads observed online', () => {
    const { isRuntimeCacheableRequest } = loadServiceWorkerPolicy()

    expect(isRuntimeCacheableRequest).toEqual(expect.any(Function))
    expect(
      isRuntimeCacheableRequest?.(
        requestWithDestination('script'),
        new URL('https://game.example/assets/index-abc123.js'),
      ),
    ).toBe(true)
    expect(
      isRuntimeCacheableRequest?.(
        requestWithDestination('style'),
        new URL('https://game.example/assets/index-abc123.css'),
      ),
    ).toBe(true)
    expect(
      isRuntimeCacheableRequest?.(
        new Request('https://game.example/assets/index-abc123.js', {
          headers: { accept: '*/*' },
          mode: 'cors',
        }),
        new URL('https://game.example/assets/index-abc123.js'),
      ),
    ).toBe(true)
    expect(
      isRuntimeCacheableRequest?.(
        requestWithDestination('script'),
        new URL('https://cdn.example/assets/index-abc123.js'),
      ),
    ).toBe(false)
  })

  it('matches cached runtime assets regardless of Vary headers from the preview server', async () => {
    let cacheMatchOptions: CacheQueryOptions | undefined
    const context = loadServiceWorkerPolicy({
      caches: {
        match: async (_request, options) => {
          cacheMatchOptions = options
          return new Response('cached asset')
        },
      },
    })

    await expect(context.cacheFirst?.(new Request('https://game.example/assets/index-abc123.js'))).resolves.toEqual(
      expect.any(Response),
    )
    expect(cacheMatchOptions).toMatchObject({ ignoreVary: true })
  })
})
