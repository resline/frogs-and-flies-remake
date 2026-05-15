import { describe, expect, it } from 'vitest'
import { FIXED_TIMESTEP_SECONDS } from '../../src/game/constants'
import { createFixedStep } from '../../src/game/fixedStep'

describe('createFixedStep', () => {
  it('advances whole 1/60 second steps and preserves remainder', () => {
    const fixed = createFixedStep(FIXED_TIMESTEP_SECONDS)
    let steps = 0
    fixed.advance(FIXED_TIMESTEP_SECONDS * 2.5, () => {
      steps += 1
    })
    expect(steps).toBe(2)
    expect(fixed.accumulatorSeconds).toBeCloseTo(FIXED_TIMESTEP_SECONDS * 0.5)
  })

  it('caps large frame deltas to avoid spiral of death', () => {
    const fixed = createFixedStep(FIXED_TIMESTEP_SECONDS, 5)
    let steps = 0
    fixed.advance(10, () => {
      steps += 1
    })
    expect(steps).toBe(5)
  })
})
