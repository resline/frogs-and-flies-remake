import { describe, expect, it } from 'vitest'
import { createRuntimeOptions, readRuntimeOptions } from '../../src/runtime/options'
import { readRuntimeParams } from '../../src/runtime/params'

describe('runtime options parsing', () => {
  it('defaults to stable classic standard options', () => {
    const options = readRuntimeOptions(new URLSearchParams(''))

    expect(options.difficulty).toBe('classic-standard')
    expect(options.reducedMotion).toBe(false)
    expect(options.highContrast).toBe(false)
    expect(options.showTimer).toBe(true)
    expect(options.mute).toBe(false)
    expect(options.volume).toBe(1)
  })

  it('parses difficulty, accessibility, timer, and audio params', () => {
    const params = readRuntimeParams(
      new URLSearchParams(
        'difficulty=classic-assist&reducedMotion=1&highContrast=1&showTimer=0&mute=1&volume=0.35',
      ),
    )

    expect(params.options.difficulty).toBe('classic-assist')
    expect(params.options.reducedMotion).toBe(true)
    expect(params.options.highContrast).toBe(true)
    expect(params.options.showTimer).toBe(false)
    expect(params.options.mute).toBe(true)
    expect(params.options.volume).toBe(0.35)
  })

  it('clamps invalid runtime options without changing defaults', () => {
    expect(readRuntimeOptions(new URLSearchParams('difficulty=unknown&volume=5'))).toEqual(createRuntimeOptions())
    expect(readRuntimeOptions(new URLSearchParams('volume=-0.25')).volume).toBe(0)
  })
})
