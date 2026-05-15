export type InputActionId =
  | 'p1.moveLeft'
  | 'p1.moveRight'
  | 'p1.chargeJump'
  | 'p1.releaseJump'
  | 'p1.tongue'
  | 'p2.moveLeft'
  | 'p2.moveRight'
  | 'p2.chargeJump'
  | 'p2.releaseJump'
  | 'p2.tongue'
  | 'ui.start'
  | 'ui.pause'
  | 'ui.confirm'
  | 'ui.back'

export type InputDeviceType = 'keyboard' | 'pointer' | 'touch' | 'gamepad'

export interface InputBinding {
  action: InputActionId
  device: InputDeviceType
  code: string
}

export interface InputProfile {
  id: string
  name: string
  bindings: InputBinding[]
}

export const DEFAULT_INPUT_PROFILE: InputProfile = {
  id: 'default',
  name: 'Default',
  bindings: [
    { action: 'p1.moveLeft', device: 'keyboard', code: 'KeyA' },
    { action: 'p1.moveLeft', device: 'keyboard', code: 'ArrowLeft' },
    { action: 'p1.moveRight', device: 'keyboard', code: 'KeyD' },
    { action: 'p1.moveRight', device: 'keyboard', code: 'ArrowRight' },
    { action: 'p1.chargeJump', device: 'keyboard', code: 'Space' },
    { action: 'p1.releaseJump', device: 'keyboard', code: 'Space' },
    { action: 'p1.tongue', device: 'keyboard', code: 'KeyT' },
    { action: 'p2.moveLeft', device: 'keyboard', code: 'KeyJ' },
    { action: 'p2.moveRight', device: 'keyboard', code: 'KeyL' },
    { action: 'p2.chargeJump', device: 'keyboard', code: 'KeyI' },
    { action: 'p2.releaseJump', device: 'keyboard', code: 'KeyI' },
    { action: 'p2.tongue', device: 'keyboard', code: 'KeyO' },
    { action: 'ui.start', device: 'keyboard', code: 'Enter' },
    { action: 'ui.confirm', device: 'keyboard', code: 'Enter' },
    { action: 'ui.pause', device: 'keyboard', code: 'KeyP' },
    { action: 'ui.back', device: 'keyboard', code: 'Escape' },
  ],
}

const RESERVED_BROWSER_SHORTCUTS = new Set([
  'Alt+ArrowLeft',
  'Alt+ArrowRight',
  'Control+KeyR',
  'Control+KeyW',
  'Control+KeyL',
  'Meta+KeyR',
  'Meta+KeyW',
  'Meta+KeyL',
])

export function createDefaultInputProfiles(): InputProfile[] {
  return [cloneProfile(DEFAULT_INPUT_PROFILE)]
}

export function normalizeBinding(binding: InputBinding): InputBinding {
  return {
    action: binding.action,
    device: binding.device,
    code: binding.code.trim(),
  }
}

export function detectBindingConflict(profile: InputProfile, binding: InputBinding): InputBinding | undefined {
  const normalized = normalizeBinding(binding)

  return profile.bindings.find((candidate) => {
    const next = normalizeBinding(candidate)
    return next.device === normalized.device && next.code === normalized.code && next.action !== normalized.action
  })
}

export function isBrowserReservedShortcut(input: {
  code: string
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
}): boolean {
  const parts = [
    input.altKey ? 'Alt' : '',
    input.ctrlKey ? 'Control' : '',
    input.metaKey ? 'Meta' : '',
    input.shiftKey ? 'Shift' : '',
    input.code,
  ].filter(Boolean)

  return RESERVED_BROWSER_SHORTCUTS.has(parts.join('+'))
}

export function resetProfileToDefaults(profile: InputProfile = DEFAULT_INPUT_PROFILE): InputProfile {
  return {
    ...cloneProfile(DEFAULT_INPUT_PROFILE),
    id: profile.id,
    name: profile.name,
  }
}

function cloneProfile(profile: InputProfile): InputProfile {
  return {
    id: profile.id,
    name: profile.name,
    bindings: profile.bindings.map((binding) => ({ ...binding })),
  }
}
