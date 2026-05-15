import { describe, expect, test } from 'vitest'
import { Container } from 'pixi.js'
import { createRenderLayers } from '../../src/runtime/layers'

describe('createRenderLayers', () => {
  test('creates a Pixi root container with named render layers in draw order', () => {
    const layers = createRenderLayers()

    expect(layers.root).toBeInstanceOf(Container)
    expect(layers.root.label).toBe('root')
    expect(layers.root.children.map((child) => child.label)).toEqual(['background', 'gameplay', 'effects', 'ui'])
    expect(layers.background.parent).toBe(layers.root)
    expect(layers.gameplay.parent).toBe(layers.root)
    expect(layers.effects.parent).toBe(layers.root)
    expect(layers.ui.parent).toBe(layers.root)
  })
})
