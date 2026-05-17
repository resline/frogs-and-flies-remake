import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import {
  M28_CAMPAIGN_UI_ASSET_PATHS,
  M28_GAMEPLAY_ASSET_PATHS,
  M28_PROLOGUE_ASSET_PATH_BY_TONE,
} from '../../src/runtime/assets'
import { LOCAL_AUDIO_ASSET_REGISTRY } from '../../src/runtime/audio'
import {
  PWA_CACHE_NAME,
  buildPwaCacheUrls,
  collectPwaRuntimeAssetUrls,
  isSameOriginPwaUrl,
  registerServiceWorker,
  type ServiceWorkerRegistrationOptions,
} from '../../src/runtime/pwa'

interface ServiceWorkerPolicyContext {
  caches?: {
    match: (request: Request, options?: CacheQueryOptions) => Promise<Response | undefined>
    open?: (cacheName: string) => Promise<{ put: (request: Request, response: Response) => Promise<void> }>
  }
  cacheFirst?: (request: Request) => Promise<Response>
  runtimeCacheableResponse?: (request: Request) => Promise<Response>
  fetch?: (request: Request) => Promise<Response>
  Response?: typeof Response
  self: {
    addEventListener: () => void
    location: { origin: string }
  }
  __TEST_APP_SHELL_CACHE_URLS?: string[]
  __TEST_PWA_CACHE_NAME?: string
  isRuntimeCacheableRequest?: (request: Request, url: URL) => boolean
}

function loadServiceWorkerPolicy(overrides: Partial<ServiceWorkerPolicyContext> = {}): ServiceWorkerPolicyContext {
  const source = readFileSync(new URL('../../public/service-worker.js', import.meta.url), 'utf8')
  const context: ServiceWorkerPolicyContext = {
    Response,
    self: {
      addEventListener: () => undefined,
      location: { origin: 'https://game.example' },
    },
    ...overrides,
  }

  vm.createContext(context)
  vm.runInContext(
    `${source}
globalThis.__TEST_PWA_CACHE_NAME = PWA_CACHE_NAME
globalThis.__TEST_APP_SHELL_CACHE_URLS = APP_SHELL_CACHE_URLS
`,
    context,
  )
  return context
}

function requestWithDestination(destination: RequestDestination): Request {
  return { destination } as Request
}

function flattenLocalAudioPaths(): string[] {
  return [
    ...Object.values(LOCAL_AUDIO_ASSET_REGISTRY.sfx).flatMap((paths) => paths ?? []),
    ...Object.values(LOCAL_AUDIO_ASSET_REGISTRY.music).flatMap((paths) => paths ?? []),
  ]
}

describe('PWA cache contract', () => {
  it('uses an M2.8 cache version', () => {
    expect(PWA_CACHE_NAME).toContain('m28')
  })

  it('includes the shell, manifest, required M2.8 visuals, and local audio paths', () => {
    const urls = buildPwaCacheUrls()

    expect(urls).toEqual(
      expect.arrayContaining([
        '/',
        '/manifest.webmanifest',
        '/favicon.png',
        ...M28_GAMEPLAY_ASSET_PATHS,
        ...Object.values(M28_PROLOGUE_ASSET_PATH_BY_TONE),
        ...M28_CAMPAIGN_UI_ASSET_PATHS,
        ...flattenLocalAudioPaths(),
      ]),
    )
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

  it('exposes the M2.8 service worker app shell and static asset cache policy', () => {
    const { __TEST_APP_SHELL_CACHE_URLS, __TEST_PWA_CACHE_NAME, isRuntimeCacheableRequest } = loadServiceWorkerPolicy()

    expect(__TEST_PWA_CACHE_NAME).toContain('m28')
    expect(__TEST_APP_SHELL_CACHE_URLS).toEqual(
      expect.arrayContaining([
        '/',
        '/manifest.webmanifest',
        '/favicon.png',
        '/assets/m28/m28-home-pond-background-v1.png',
        '/assets/m28/m28-ui-star-filled-v1.png',
        '/audio/sfx/jump.mp3',
        '/audio/music/home-pond-loop.mp3',
      ]),
    )
    expect(
      isRuntimeCacheableRequest?.(
        requestWithDestination('image'),
        new URL('https://game.example/assets/m28/m28-ui-star-filled-v1.png'),
      ),
    ).toBe(true)
    expect(
      isRuntimeCacheableRequest?.(
        requestWithDestination('audio'),
        new URL('https://game.example/audio/sfx/jump.mp3'),
      ),
    ).toBe(true)
    expect(
      isRuntimeCacheableRequest?.(
        requestWithDestination('audio'),
        new URL('https://cdn.example/audio/sfx/jump.mp3'),
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

  it('returns an offline asset response instead of rejecting runtime cache fetch failures', async () => {
    const context = loadServiceWorkerPolicy({
      caches: {
        match: async () => undefined,
      },
      fetch: async () => {
        throw new TypeError('network offline')
      },
    })

    const response = await context.cacheFirst?.(new Request('https://game.example/assets/m28/m28-prologue-dawn-v1.png'))

    expect(response).toBeInstanceOf(Response)
    expect(response?.ok).toBe(false)
    expect(response?.status).toBe(504)
  })

  it('returns an offline asset response instead of rejecting runtime cache lookup failures', async () => {
    const context = loadServiceWorkerPolicy({
      caches: {
        match: async () => {
          throw new TypeError('cache unavailable')
        },
      },
    })

    const response = await context.cacheFirst?.(new Request('https://game.example/assets/m28/m28-prologue-dawn-v1.png'))

    expect(response).toBeInstanceOf(Response)
    expect(response?.ok).toBe(false)
    expect(response?.status).toBe(504)
  })

  it('uses network-first handling for no-cors runtime image requests', async () => {
    let cacheChecked = false
    let fetched = false
    const context = loadServiceWorkerPolicy({
      caches: {
        match: async () => {
          cacheChecked = true
          throw new TypeError('cache unavailable')
        },
      },
      fetch: async () => {
        fetched = true
        return new Response('image bytes')
      },
    })

    const response = await context.runtimeCacheableResponse?.(
      new Request('https://game.example/assets/m28/m28-prologue-dawn-v1.png', { mode: 'no-cors' }),
    )

    expect(response).toBeInstanceOf(Response)
    expect(response?.ok).toBe(true)
    expect(fetched).toBe(true)
    expect(cacheChecked).toBe(false)
  })

  it('marks runtime cache ready only after warmed runtime assets are written to the PWA cache', async () => {
    const runtimeUrls = ['/@vite/client', '/src/main.ts']
    const attributes = new Map<string, string>()
    const fetches: Array<{ url: string; cache?: RequestCache; credentials?: RequestCredentials }> = []
    const cachePuts: string[] = []
    const markerElement = {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
    } as HTMLElement
    const root = {
      querySelectorAll: () =>
        runtimeUrls.map((src) => ({
          getAttribute: (name: string) => (name === 'src' ? src : null),
        })),
    } as unknown as ParentNode
    const serviceWorker = {
      controller: {},
      ready: Promise.resolve({}),
      register: async () => ({}),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    } as unknown as ServiceWorkerContainer
    const cacheStorage = {
      open: async (cacheName: string) => {
        expect(cacheName).toBe(PWA_CACHE_NAME)
        return {
          put: async (request: RequestInfo | URL, response: Response) => {
            cachePuts.push(typeof request === 'string' ? request : request.url)
            expect(response.ok).toBe(true)
          },
        }
      },
    }
    const fetcher = async (url: RequestInfo | URL, init?: RequestInit) => {
      fetches.push({
        url: url.toString(),
        cache: init?.cache,
        credentials: init?.credentials,
      })
      return new Response('runtime asset')
    }

    await expect(
      registerServiceWorker({
        markerElement,
        serviceWorker,
        documentRoot: root,
        fetcher,
        origin: 'https://game.example',
        cacheStorage,
      } as ServiceWorkerRegistrationOptions & { cacheStorage: typeof cacheStorage }),
    ).resolves.toBe('registered')

    expect(fetches).toEqual([
      {
        url: 'https://game.example/@vite/client',
        cache: 'reload',
        credentials: 'same-origin',
      },
      {
        url: 'https://game.example/src/main.ts',
        cache: 'reload',
        credentials: 'same-origin',
      },
    ])
    expect(cachePuts).toEqual(['https://game.example/@vite/client', 'https://game.example/src/main.ts'])
    expect(attributes.get('data-pwa-runtime-cache-ready')).toBe('true')
    expect(attributes.get('data-pwa-registration')).toBe('registered')
  })

  it('marks successful service worker registration before slow runtime cache warming completes', async () => {
    const attributes = new Map<string, string>()
    const markerElement = {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
    } as HTMLElement
    const root = {
      querySelectorAll: () => [
        {
          getAttribute: (name: string) => (name === 'src' ? '/assets/index.js' : null),
        },
      ],
    } as unknown as ParentNode
    const serviceWorker = {
      controller: {},
      ready: Promise.resolve({}),
      register: async () => ({}),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    } as unknown as ServiceWorkerContainer
    const cacheStorage = {
      open: async () => ({
        put: async () => undefined,
      }),
    }
    let resolveRuntimeFetch: ((response: Response) => void) | undefined
    let registrationPromise: Promise<string> | undefined
    const runtimeFetchStarted = new Promise<void>((resolve) => {
      const fetcher = async () =>
        new Promise<Response>((resolveFetch) => {
          resolveRuntimeFetch = resolveFetch
          resolve()
        })

      registrationPromise = registerServiceWorker({
        markerElement,
        serviceWorker,
        documentRoot: root,
        fetcher,
        origin: 'https://game.example',
        cacheStorage,
      } as ServiceWorkerRegistrationOptions & { cacheStorage: typeof cacheStorage })
    })

    await runtimeFetchStarted

    expect(attributes.get('data-pwa-registration')).toBe('registered')
    expect(attributes.get('data-pwa-runtime-cache-ready')).toBeUndefined()

    resolveRuntimeFetch?.(new Response('runtime asset'))
    await expect(registrationPromise).resolves.toBe('registered')
    expect(attributes.get('data-pwa-runtime-cache-ready')).toBe('true')
  })
})
