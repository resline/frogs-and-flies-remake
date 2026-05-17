import { describe, expect, it } from 'vitest'
import { resolveCampaignEncounterProfile } from '../../src/content/registry'
import type { CampaignLevelId, EncounterEntityKind } from '../../src/content/types'
import { createGame } from '../../src/game/createGame'
import { getClassicDifficulty } from '../../src/game/difficulty'
import { runDeterministicReplay, type ReplayCommandScript } from '../../src/game/replay'
import { updateGame } from '../../src/game/update'
import { resolveEncounterProfileGameOptions } from '../../src/runtime/encounterOptions'

const HOME_POND_LEVEL_IDS = [
  'home-pond-1-1-first-hunt',
  'home-pond-1-2-quick-tongue',
  'home-pond-1-3-nightfall-feast',
] as const satisfies readonly CampaignLevelId[]

interface EncounterMetrics {
  spawnedFlyCount: number
  liveFlyCount: number
  spawnedPowerCount: number
  livePowerCount: number
  maxLiveEntityCount: number
  flyYRange: MetricRange
  flyVyRange: MetricRange
  liveFlyPositions: readonly {
    id: number
    x: number
    y: number
    vx: number
    vy: number
  }[]
  spawnedEntityKinds: readonly EncounterEntityKind[]
  liveEntityKinds: readonly EncounterEntityKind[]
}

interface MetricRange {
  min: number
  max: number
}

describe('deterministic replay', () => {
  it('replays the same seeded command script with identical scoring and time transitions', () => {
    const script: ReplayCommandScript = [
      { step: 0, commands: { start: true } },
      { step: 12, players: { p1: { tongue: true, humanInput: true } } },
      { step: 36, players: { p1: { moveRight: true, humanInput: true } } },
      { step: 72, players: { p1: { chargeJump: true, humanInput: true } } },
      { step: 84, players: { p1: { releaseJump: true, humanInput: true } } },
      { step: 120, players: { p2: { tongue: true } } },
      { step: 180, players: { p1: { tongue: true, humanInput: true } } },
    ]

    const replayOptions = {
      seed: 90210,
      mode: 'classic-single' as const,
      durationSeconds: 6,
      theEndSeconds: 0.25,
      difficulty: 'classic-standard' as const,
      totalSteps: 390,
      script,
    }

    const first = runDeterministicReplay(replayOptions)
    const second = runDeterministicReplay(replayOptions)

    expect(second.events).toEqual(first.events)
    expect(second.players).toEqual(first.players)
    expect(second.winner).toBe(first.winner)
    expect(second.timeOfDayTransitions).toEqual(first.timeOfDayTransitions)
    expect(first.timeOfDayTransitions.map((transition) => transition.timeOfDay)).toEqual([
      'day',
      'dusk',
      'night',
      'the-end',
    ])
  })

  it('collects identical Home Pond encounter metrics for the same level and seed', () => {
    for (const levelId of HOME_POND_LEVEL_IDS) {
      expect(collectEncounterMetrics(levelId, 2909)).toEqual(collectEncounterMetrics(levelId, 2909))
    }
  })

  it('produces distinct fixed-step balancing metrics across Home Pond encounter profiles', () => {
    const baseline = collectEncounterMetrics('home-pond-1-1-first-hunt')
    const quickTongue = collectEncounterMetrics('home-pond-1-2-quick-tongue')
    const nightfall = collectEncounterMetrics('home-pond-1-3-nightfall-feast')

    expect(quickTongue.spawnedFlyCount).toBeGreaterThanOrEqual(baseline.spawnedFlyCount)
    expect(nightfall.spawnedFlyCount).toBeGreaterThan(quickTongue.spawnedFlyCount)
    expect(new Set([rangeKey(baseline.flyYRange), rangeKey(quickTongue.flyYRange), rangeKey(nightfall.flyYRange)]).size).toBe(3)
    expect(new Set([rangeKey(baseline.flyVyRange), rangeKey(quickTongue.flyVyRange), rangeKey(nightfall.flyVyRange)]).size).toBe(3)

    for (const metrics of [baseline, quickTongue, nightfall]) {
      expect(metrics.spawnedEntityKinds.every((kind) => kind === 'fly' || kind === 'power')).toBe(true)
      expect(metrics.liveEntityKinds.every((kind) => kind === 'fly' || kind === 'power')).toBe(true)
    }
  })
})

function collectEncounterMetrics(levelId: CampaignLevelId, seed = 2909): EncounterMetrics {
  const profile = resolveCampaignEncounterProfile(levelId)
  if (!profile) {
    throw new Error(`missing profile for ${levelId}`)
  }

  const tuning = resolveEncounterProfileGameOptions(profile, getClassicDifficulty('classic-standard'))
  const game = createGame({
    seed,
    mode: 'classic-single',
    difficulty: 'classic-standard',
    ...tuning,
  })
  const spawnedEntities = new Map<number, { kind: EncounterEntityKind; y: number; vy: number }>()
  let maxLiveEntities = 0

  game.commands.start = true
  updateGame(game, 1 / 60)
  collectVisibleEntities()
  for (let step = 0; step < 8 * 60; step += 1) {
    updateGame(game, 1 / 60)
    collectVisibleEntities()
  }

  const liveEntities = game.entityIds.map((id) => game.entities[id]).filter((entity) => Boolean(entity))
  const liveFlies = liveEntities.filter((entity) => entity.kind === 'fly')
  const livePowers = liveEntities.filter((entity) => entity.kind === 'power')
  const spawnedFlies = [...spawnedEntities.values()].filter((entity) => entity.kind === 'fly')
  const spawnedPowers = [...spawnedEntities.values()].filter((entity) => entity.kind === 'power')

  return {
    spawnedFlyCount: spawnedFlies.length,
    liveFlyCount: liveFlies.length,
    spawnedPowerCount: spawnedPowers.length,
    livePowerCount: livePowers.length,
    maxLiveEntityCount: maxLiveEntities,
    flyYRange: range(spawnedFlies.map((fly) => fly.y)),
    flyVyRange: range(spawnedFlies.map((fly) => fly.vy)),
    liveFlyPositions: liveFlies.map((fly) => ({
      id: fly.id,
      x: roundMetric(fly.x),
      y: roundMetric(fly.y),
      vx: roundMetric(fly.vx),
      vy: roundMetric(fly.vy ?? 0),
    })),
    spawnedEntityKinds: uniqueKinds([...spawnedEntities.values()].map((entity) => entity.kind)),
    liveEntityKinds: uniqueKinds(liveEntities.map((entity) => entity.kind)),
  }

  function collectVisibleEntities(): void {
    const entities = game.entityIds.map((id) => game.entities[id]).filter((entity) => Boolean(entity))
    maxLiveEntities = Math.max(maxLiveEntities, entities.length)
    for (const entity of entities) {
      if (!spawnedEntities.has(entity.id)) {
        spawnedEntities.set(entity.id, {
          kind: entity.kind,
          y: roundMetric(entity.y),
          vy: roundMetric(entity.vy ?? 0),
        })
      }
    }
  }
}

function range(values: readonly number[]): MetricRange {
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

function rangeKey(rangeValue: MetricRange): string {
  return `${rangeValue.min}:${rangeValue.max}`
}

function roundMetric(value: number): number {
  return Number(value.toFixed(3))
}

function uniqueKinds(kinds: readonly EncounterEntityKind[]): readonly EncounterEntityKind[] {
  return [...new Set(kinds)].sort()
}
