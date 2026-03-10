import axios from 'axios'
const api = axios.create({ baseURL: '/api', timeout: 120000 })
export const interviewAPI = {
  create: (fd) => api.post('/interviews/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: () => api.get('/interviews/'),
  get: (id) => api.get(`/interviews/${id}`),
  runDemo: (id, position) => api.post(`/interviews/${id}/demo`, null, { params: { position } }),
  getStatus: (id) => api.get(`/analysis/${id}/status`),
  getReport: (id) => api.get(`/reports/${id}`),
}
export const pollStatus = (id, onUpdate, ms = 2000) => {
  const iv = setInterval(async () => {
    try {
      const { data } = await interviewAPI.getStatus(id)
      onUpdate(data)
      if (data.status === 'completed' || data.status === 'failed') clearInterval(iv)
    } catch(e) { console.error(e) }
  }, ms)
  return () => clearInterval(iv)
}
export default api
