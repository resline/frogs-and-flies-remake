import { describe, expect, it } from 'vitest'
import { createPrng } from '../../src/game/prng'

describe('createPrng', () => {
  it('replays the same sequence for the same seed', () => {
    const a = createPrng(12345)
    const b = createPrng(12345)
    expect([a.float(), a.float(), a.int(1, 10)]).toEqual([b.float(), b.float(), b.int(1, 10)])
  })

  it('keeps int results inside the inclusive range', () => {
    const prng = createPrng(7)
    for (let i = 0; i < 100; i += 1) {
      const value = prng.int(3, 5)
      expect(value).toBeGreaterThanOrEqual(3)
      expect(value).toBeLessThanOrEqual(5)
    }
  })
})
