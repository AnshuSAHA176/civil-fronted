import { apiClient } from '../services/apiClient'

// The backend returns only currently-unread notifications. Serializing them
// also marks each notification as read, so this endpoint is intentionally
// treated as a consume-on-read operation rather than a persistent inbox.
export const getNotifications = () => apiClient.get('/notification/')
