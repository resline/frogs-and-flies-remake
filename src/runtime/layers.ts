import { Container } from 'pixi.js'

export const RENDER_LAYER_NAMES = ['background', 'gameplay', 'effects', 'ui'] as const

export type RenderLayerName = (typeof RENDER_LAYER_NAMES)[number]

export type RenderLayers = {
  root: Container
  background: Container
  gameplay: Container
  effects: Container
  ui: Container
}

export function createRenderLayers(): RenderLayers {
  const root = createNamedContainer('root')
  const background = createNamedContainer('background')
  const gameplay = createNamedContainer('gameplay')
  const effects = createNamedContainer('effects')
  const ui = createNamedContainer('ui')

  root.addChild(background, gameplay, effects, ui)

  return {
    root,
    background,
    gameplay,
    effects,
    ui,
  }
}

function createNamedContainer(label: string): Container {
  const container = new Container()
  container.label = label
  return container
}
