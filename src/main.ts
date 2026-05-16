import './style.css'
import { startRuntime } from './runtime/app'
import { readRuntimeParams } from './runtime/params'
import { registerServiceWorker } from './runtime/pwa'
import { createSaveManager } from './runtime/save'

const saveManager = createSaveManager()
const saveLoad = saveManager.load()
const params = readRuntimeParams(new URLSearchParams(window.location.search), saveLoad.data.settings)
const appRoot = document.querySelector<HTMLElement>('#app')

if (!appRoot) {
  throw new Error('Missing #app mount point')
}

void startRuntime(appRoot, params, {
  saveManager,
  saveData: saveLoad.data,
  saveStatus: saveLoad.status,
}).then(() => {
  void registerServiceWorker({
    markerElement: appRoot.querySelector<HTMLElement>('[data-testid="m26-shell"]'),
  })
})
