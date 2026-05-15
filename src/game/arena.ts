import {
  HOME_POND_LEFT_LILY_X,
  HOME_POND_LILY_LANDING_RADIUS,
  HOME_POND_LILY_Y,
  HOME_POND_RIGHT_LILY_X,
} from './constants'
import type { FacingDirection, HomeLilyId, PlayerId } from './types'

export const HOME_POND_LILIES = {
  left: {
    id: 'left',
    x: HOME_POND_LEFT_LILY_X,
    y: HOME_POND_LILY_Y,
    landingRadius: HOME_POND_LILY_LANDING_RADIUS,
  },
  right: {
    id: 'right',
    x: HOME_POND_RIGHT_LILY_X,
    y: HOME_POND_LILY_Y,
    landingRadius: HOME_POND_LILY_LANDING_RADIUS,
  },
} as const

export const HOME_POND_FLY_BAND = {
  minY: 96,
  maxY: 360,
} as const

export function homeLilyForPlayer(playerId: PlayerId): (typeof HOME_POND_LILIES)[HomeLilyId] {
  return HOME_POND_LILIES[playerId === 'p1' ? 'left' : 'right']
}

export function facingForPlayer(playerId: PlayerId): FacingDirection {
  return playerId === 'p1' ? 'right' : 'left'
}
