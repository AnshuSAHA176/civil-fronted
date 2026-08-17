import axios from 'axios'
import storage from '../utils/storage'

const baseURL = (import.meta.env.VITE_API_BASE_URL || 'https://civil-service-1.onrender.com/').replace(/\/$/, '')

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const token = storage.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storage.clearSession()
      window.dispatchEvent(new CustomEvent('civicai:session-expired'))
    }

    return Promise.reject(error)
  },
)

export const getApiError = (error) => {
  if (!error?.response) {
    return { status: null, message: 'Unable to connect to the CivicAI server.' }
  }

  const { status, data } = error.response
  let message = 'Something went wrong. Please try again.'

  if (typeof data === 'string' && data.trim()) message = data
  else if (data?.detail) message = data.detail
  else if (data?.message) message = data.message
  else if (data && typeof data === 'object') {
    const first = Object.values(data).flat().find((value) => typeof value === 'string')
    if (first) message = first
  }

  if (status === 401) message = 'Your session has expired. Please sign in again.'
  if (status === 403) message = 'You do not have permission to perform this action.'
  if (status === 404) message = 'The requested resource was not found.'

  return { status, message, data }
}
