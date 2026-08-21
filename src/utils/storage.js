const ACCESS_TOKEN_KEY = 'civicai_access_token'
const REFRESH_TOKEN_KEY = 'civicai_refresh_token'
const USER_KEY = 'civicai_user'
const storage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },
  setSession({ access, refresh, user = null }) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  setUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  },
  clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}

export default storage
