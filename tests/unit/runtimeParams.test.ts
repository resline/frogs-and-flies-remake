import { describe, expect, it } from 'vitest'
import { readRuntimeParams } from '../../src/runtime/params'

describe('M2 runtime params', () => {
  it('defaults to classic single, seed 1, and production match timing', () => {
    const params = readRuntimeParams(new URLSearchParams(''))

    expect(params.seed).toBe(1)
    expect(params.mode).toBe('classic-single')
    expect(params.durationSeconds).toBeUndefined()
    expect(params.theEndSeconds).toBeUndefined()
    expect(params.smokeState).toBeUndefined()
    expect(params.smokeElapsedSeconds).toBeUndefined()
    expect(params.simulationSpeed).toBe(1)
  })

  it('parses local versus, seed, smoke state, short duration, and simulation speed', () => {
    const params = readRuntimeParams(
      new URLSearchParams(
        'mode=local-versus&seed=42&smokeState=results&smokeElapsedSeconds=179&durationSeconds=3&theEndSeconds=0.5&simulationSpeed=20',
      ),
    )

    expect(params.mode).toBe('local-versus')
    expect(params.seed).toBe(42)
    expect(params.smokeState).toBe('results')
    expect(params.smokeElapsedSeconds).toBe(179)
    expect(params.durationSeconds).toBe(3)
    expect(params.theEndSeconds).toBe(0.5)
    expect(params.simulationSpeed).toBe(20)
  })

  it('parses campaign smoke objective params for focused E2E only', () => {
    const params = readRuntimeParams(new URLSearchParams('campaignSmokeScore=900&campaignSmokeCatches=9'))

    expect(params.campaignSmokeScore).toBe(900)
    expect(params.campaignSmokeCatches).toBe(9)
  })

  it('ignores invalid campaign smoke objective params', () => {
    const params = readRuntimeParams(new URLSearchParams('campaignSmokeScore=-1&campaignSmokeCatches=not-a-number'))

    expect(params.campaignSmokeScore).toBeUndefined()
    expect(params.campaignSmokeCatches).toBeUndefined()
  })
})
