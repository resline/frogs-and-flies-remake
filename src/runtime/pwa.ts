import { GENERATED_GAMEPLAY_ASSET_PATHS } from './assets'
import { LOCAL_AUDIO_ASSET_REGISTRY } from './audio'

export const PWA_CACHE_NAME = 'frogs-and-flies-m26-v2'

export type PwaRegistrationStatus = 'registered' | 'unsupported' | 'failed'

export interface PwaCacheUrlOptions {
  availablePaths?: ReadonlySet<string>
}

export interface ServiceWorkerRegistrationOptions {
  markerElement?: HTMLElement | null
  serviceWorker?: ServiceWorkerContainer
  serviceWorkerPath?: string
  documentRoot?: ParentNode
  fetcher?: typeof fetch
  origin?: string
}

const PWA_SHELL_URLS = ['/', '/manifest.webmanifest'] as const

export function buildPwaCacheUrls(options: PwaCacheUrlOptions = {}): string[] {
  const urls = new Set<string>([...PWA_SHELL_URLS, '/favicon.png', ...GENERATED_GAMEPLAY_ASSET_PATHS])

  for (const path of optionalAudioPaths()) {
    if (options.availablePaths?.has(path)) {
      urls.add(path)
    }
  }

  return [...urls]
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
    return markPwaRegistration(options.markerElement, 'unsupported')
  }

  try {
    await serviceWorker.register(serviceWorkerPath)
    await warmPwaRuntimeAssets(options)
    return markPwaRegistration(options.markerElement, 'registered')
  } catch (error) {
    console.warn('Service worker registration failed.', error)
    return markPwaRegistration(options.markerElement, 'failed')
  }
}

async function warmPwaRuntimeAssets(options: ServiceWorkerRegistrationOptions): Promise<void> {
  const serviceWorker = options.serviceWorker ?? navigator.serviceWorker
  const fetcher = options.fetcher ?? fetch
  const root = options.documentRoot ?? document
  const origin = options.origin ?? window.location.origin

  await serviceWorker.ready
  await waitForServiceWorkerControl(serviceWorker)

  await Promise.all(
    collectPwaRuntimeAssetUrls(root, origin).map((url) =>
      fetcher(url, {
        cache: 'reload',
        credentials: 'same-origin',
      }).catch(() => undefined),
    ),
  )
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

function optionalAudioPaths(): string[] {
  return [
    ...Object.values(LOCAL_AUDIO_ASSET_REGISTRY.sfx).flatMap((paths) => paths ?? []),
    ...Object.values(LOCAL_AUDIO_ASSET_REGISTRY.music).flatMap((paths) => paths ?? []),
  ]
}
