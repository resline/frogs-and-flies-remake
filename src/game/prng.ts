export interface Prng {
  float(): number
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
}

export function createPrng(seed: number): Prng {
  let state = seed >>> 0

  const float = () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }

  return {
    float,
    int(min, max) {
      const low = Math.ceil(min)
      const high = Math.floor(max)
      return Math.floor(float() * (high - low + 1)) + low
    },
    pick(items) {
      if (items.length === 0) {
        throw new Error('Cannot pick from an empty list')
      }
      return items[this.int(0, items.length - 1)]
    },
  }
}
