import './style.css'
import { startRuntime } from './runtime/app'
import { readRuntimeParams } from './runtime/params'

const params = readRuntimeParams(new URLSearchParams(window.location.search))
const appRoot = document.querySelector<HTMLElement>('#app')

if (!appRoot) {
  throw new Error('Missing #app mount point')
}

void startRuntime(appRoot, params)
