export interface FixedStep {
  readonly accumulatorSeconds: number
  advance(deltaSeconds: number, step: () => void): void
  reset(): void
}

export function createFixedStep(stepSeconds: number, maxStepsPerFrame = 8): FixedStep {
  let accumulatorSeconds = 0

  return {
    get accumulatorSeconds() {
      return accumulatorSeconds
    },
    advance(deltaSeconds, step) {
      accumulatorSeconds += Math.max(0, deltaSeconds)

      let steps = 0
      while (accumulatorSeconds >= stepSeconds && steps < maxStepsPerFrame) {
        step()
        accumulatorSeconds -= stepSeconds
        steps += 1
      }

      if (steps === maxStepsPerFrame && accumulatorSeconds >= stepSeconds) {
        accumulatorSeconds = 0
      }
    },
    reset() {
      accumulatorSeconds = 0
    },
  }
}
