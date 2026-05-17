import { GENERATED_GAMEPLAY_ASSET_PATHS, M28_REQUIRED_VISUAL_ASSET_PATHS } from './assets'
import { LOCAL_AUDIO_ASSET_REGISTRY } from './audio'

export const PWA_CACHE_NAME = 'frogs-and-flies-m28-v1'

export type PwaRegistrationStatus = 'registered' | 'unsupported' | 'failed'

export interface ServiceWorkerRegistrationOptions {
  cacheStorage?: Pick<CacheStorage, 'open'>
  markerElement?: HTMLElement | null
  serviceWorker?: ServiceWorkerContainer
  serviceWorkerPath?: string
  documentRoot?: ParentNode
  fetcher?: typeof fetch
  origin?: string
}

const PWA_SHELL_URLS = ['/', '/manifest.webmanifest'] as const

export function buildPwaCacheUrls(): string[] {
  return [
    ...new Set([
      ...PWA_SHELL_URLS,
      '/favicon.png',
      ...GENERATED_GAMEPLAY_ASSET_PATHS,
      ...M28_REQUIRED_VISUAL_ASSET_PATHS,
      ...localAudioAssetPaths(),
    ]),
  ]
}

export function isSameOriginPwaUrl(url: string, origin: string): boolean {
  try {
    return new URL(url, origin).origin === origin
  } catch {
    return false
  }
}

export function collectPwaRuntimeAssetUrls(root: ParentNode = document, origin: string = window.location.origin): string[] {
  const urls = new Set<string>()
  const elements = root.querySelectorAll('script[src], link[rel="stylesheet"][href], link[rel="modulepreload"][href]')

  for (const element of elements) {
    const url = element.getAttribute('src') ?? element.getAttribute('href')
    if (!url || !isSameOriginPwaUrl(url, origin)) {
      continue
    }
    urls.add(new URL(url, origin).href)
  }

  return [...urls]
}

export async function registerServiceWorker(options: ServiceWorkerRegistrationOptions = {}): Promise<PwaRegistrationStatus> {
  const serviceWorker = options.serviceWorker ?? navigator.serviceWorker
  const serviceWorkerPath = options.serviceWorkerPath ?? '/service-worker.js'

  if (!serviceWorker) {
    markPwaRuntimeCacheReady(options.markerElement, false)
    return markPwaRegistration(options.markerElement, 'unsupported')
  }

  try {
    await serviceWorker.register(serviceWorkerPath)
    markPwaRuntimeCacheReady(options.markerElement, await warmPwaRuntimeAssets(options))
    return markPwaRegistration(options.markerElement, 'registered')
  } catch (error) {
    console.warn('Service worker registration failed.', error)
    markPwaRuntimeCacheReady(options.markerElement, false)
    return markPwaRegistration(options.markerElement, 'failed')
  }
}

async function warmPwaRuntimeAssets(options: ServiceWorkerRegistrationOptions): Promise<boolean> {
  const serviceWorker = options.serviceWorker ?? navigator.serviceWorker
  const fetcher = options.fetcher ?? fetch
  const root = options.documentRoot ?? document
  const origin = options.origin ?? window.location.origin
  const cacheStorage = options.cacheStorage ?? globalThis.caches

  await serviceWorker.ready
  await waitForServiceWorkerControl(serviceWorker)

  const assetUrls = collectPwaRuntimeAssetUrls(root, origin)
  const cacheResults = await Promise.all(assetUrls.map((url) => warmPwaRuntimeAsset(url, fetcher, cacheStorage)))

  return cacheResults.every(Boolean)
}

async function warmPwaRuntimeAsset(
  url: string,
  fetcher: typeof fetch,
  cacheStorage: Pick<CacheStorage, 'open'> | undefined,
): Promise<boolean> {
  if (!cacheStorage) {
    return false
  }

  try {
    const response = await fetcher(url, {
      cache: 'reload',
      credentials: 'same-origin',
    })

    if (!response.ok) {
      return false
    }

    const cache = await cacheStorage.open(PWA_CACHE_NAME)
    await cache.put(url, response.clone())
    return true
  } catch {
    return false
  }
}

async function waitForServiceWorkerControl(serviceWorker: ServiceWorkerContainer): Promise<void> {
  if (serviceWorker.controller) {
    return
  }

  await new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timeout)
      serviceWorker.removeEventListener('controllerchange', finish)
      resolve()
    }
    const timeout = window.setTimeout(finish, 1_000)
    serviceWorker.addEventListener('controllerchange', finish)
  })
}

function markPwaRegistration(element: HTMLElement | null | undefined, status: PwaRegistrationStatus): PwaRegistrationStatus {
  element?.setAttribute('data-pwa-registration', status)
  return status
}

function markPwaRuntimeCacheReady(element: HTMLElement | null | undefined, ready: boolean): boolean {
  element?.setAttribute('data-pwa-runtime-cache-ready', String(ready))
  return ready
}

function localAudioAssetPaths(): string[] {
  return [
    ...Object.values(LOCAL_AUDIO_ASSET_REGISTRY.sfx).flatMap((paths) => paths ?? []),
    ...Object.values(LOCAL_AUDIO_ASSET_REGISTRY.music).flatMap((paths) => paths ?? []),
  ]
}
