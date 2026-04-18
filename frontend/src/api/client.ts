import axios from 'axios'
import { getToken, getShareToken } from './auth'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT + share token to every request
client.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token
  }
  // Extract project ID from URL to look up share token
  const match = config.url?.match(/\/projects\/([^/?]+)/)
  if (match) {
    const shareToken = getShareToken(match[1])
    if (shareToken) {
      config.headers['X-Share-Token'] = shareToken
    }
  }
  return config
})

export default client
