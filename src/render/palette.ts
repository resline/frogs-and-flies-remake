import type { TimeOfDay } from '../game/types'

export type RenderPalette = {
  sky: number
  water: number
  hud: number
  ripple: number
  tint: number
  tintAlpha: number
  flourish: number
}

export function paletteFor(timeOfDay: TimeOfDay): RenderPalette {
  if (timeOfDay === 'dusk') {
    return { sky: 0x633b57, water: 0x1f5c68, hud: 0x28172b, ripple: 0xffd28a, tint: 0x321443, tintAlpha: 0.18, flourish: 0xffd28a }
  }

  if (timeOfDay === 'night') {
    return { sky: 0x101f3f, water: 0x0a394a, hud: 0x071225, ripple: 0x8bd5ff, tint: 0x02091d, tintAlpha: 0.34, flourish: 0x9fe8ff }
  }

  if (timeOfDay === 'the-end') {
    return { sky: 0x1a0a16, water: 0x17142b, hud: 0x120710, ripple: 0xfff0a8, tint: 0x140912, tintAlpha: 0.38, flourish: 0xfff0a8 }
  }

  return { sky: 0x79c7d2, water: 0x147887, hud: 0x06353a, ripple: 0xd9fff0, tint: 0xffffff, tintAlpha: 0, flourish: 0xd9fff0 }
}
