import { GENERATED_GAMEPLAY_ASSET_PATHS } from './assets'
import { LOCAL_AUDIO_ASSET_REGISTRY } from './audio'

export const PWA_CACHE_NAME = 'frogs-and-flies-m26-v1'

export type PwaRegistrationStatus = 'registered' | 'unsupported' | 'failed'

export interface PwaCacheUrlOptions {
  availablePaths?: ReadonlySet<string>
}

export interface ServiceWorkerRegistrationOptions {
  markerElement?: HTMLElement | null
  serviceWorker?: ServiceWorkerContainer
  serviceWorkerPath?: string
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

export async function registerServiceWorker(options: ServiceWorkerRegistrationOptions = {}): Promise<PwaRegistrationStatus> {
  const serviceWorker = options.serviceWorker ?? navigator.serviceWorker
  const serviceWorkerPath = options.serviceWorkerPath ?? '/service-worker.js'

  if (!serviceWorker) {
    return markPwaRegistration(options.markerElement, 'unsupported')
  }

  try {
    await serviceWorker.register(serviceWorkerPath)
    return markPwaRegistration(options.markerElement, 'registered')
  } catch (error) {
    console.warn('Service worker registration failed.', error)
    return markPwaRegistration(options.markerElement, 'failed')
  }
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
