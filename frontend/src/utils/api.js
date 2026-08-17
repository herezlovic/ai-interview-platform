import axios from 'axios'
import { localDemoAPI } from './demoEngine'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 120000,
})

let mode = 'auto' // auto | remote | local
let resolved = false

async function resolveMode() {
  if (resolved && mode !== 'auto') return mode
  if (import.meta.env.VITE_FORCE_LOCAL === 'true') {
    mode = 'local'
    resolved = true
    return mode
  }
  try {
    const { data } = await api.get('/health', { timeout: 2500 })
    if (data?.status === 'ok') {
      mode = 'remote'
      resolved = true
      return mode
    }
  } catch {
    // fall through
  }
  mode = 'local'
  resolved = true
  return mode
}

function wrap(data) {
  return { data }
}

export async function getRuntimeMode() {
  return resolveMode()
}

export const interviewAPI = {
  create: async (fd) => {
    const m = await resolveMode()
    if (m === 'local') {
      const form = Object.fromEntries(fd.entries())
      return wrap(await localDemoAPI.create(form))
    }
    return api.post('/interviews/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list: async () => {
    const m = await resolveMode()
    if (m === 'local') return wrap(await localDemoAPI.list())
    return api.get('/interviews/')
  },
  get: async (id) => {
    const m = await resolveMode()
    if (m === 'local') return wrap(await localDemoAPI.get(id))
    return api.get(`/interviews/${id}`)
  },
  runDemo: async (id, position) => {
    const m = await resolveMode()
    if (m === 'local') return wrap(await localDemoAPI.runDemo(id, position))
    return api.post(`/interviews/${id}/demo`, null, { params: { position } })
  },
  getStatus: async (id) => {
    const m = await resolveMode()
    if (m === 'local') return wrap(await localDemoAPI.getStatus(id))
    return api.get(`/analysis/${id}/status`)
  },
  getReport: async (id) => {
    const m = await resolveMode()
    if (m === 'local') return wrap(await localDemoAPI.getReport(id))
    return api.get(`/reports/${id}`)
  },
  delete: async (id) => {
    const m = await resolveMode()
    if (m === 'local') return wrap(await localDemoAPI.delete(id))
    return api.delete(`/interviews/${id}`)
  },
}

export const pollStatus = (id, onUpdate, ms = 900) => {
  let active = true
  const tick = async () => {
    if (!active) return
    try {
      const { data } = await interviewAPI.getStatus(id)
      onUpdate(data)
      if (data.status === 'completed' || data.status === 'failed') {
        active = false
        return
      }
    } catch (e) {
      console.error(e)
    }
    if (active) setTimeout(tick, ms)
  }
  tick()
  return () => {
    active = false
  }
}

export default api
