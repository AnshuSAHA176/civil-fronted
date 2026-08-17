import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import storage from '../../utils/storage'
import { citizenLogin, officialLogin, discoverOfficialRole } from './auth.api'
import { getRoleFromToken } from './auth.utils'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => storage.getAccessToken())
  const [user, setUser] = useState(() => storage.getUser())

  const establishSession = useCallback((data, fallbackRole = null) => {
    const access = data?.access
    const refresh = data?.refresh
    if (!access) throw new Error('The authentication response did not contain an access token.')

    const role = fallbackRole || getRoleFromToken(access)
    const nextUser = data?.user ? { ...data.user, role: data.user.role || role } : role ? { role } : null

    storage.setSession({ access, refresh, user: nextUser })
    setAccessToken(access)
    setUser(nextUser)
    return nextUser
  }, [])

  const loginCitizen = useCallback(async (credentials) => {
    const { data } = await citizenLogin(credentials)
    return establishSession(data, 'citizen')
  }, [establishSession])

  const loginOfficial = useCallback(async (credentials) => {
    const { data } = await officialLogin(credentials)
    const role = await discoverOfficialRole(data.access)
    return establishSession(data, role)
  }, [establishSession])

  const logout = useCallback(() => {
    storage.clearSession()
    setAccessToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const handleExpired = () => {
      setAccessToken(null)
      setUser(null)
    }
    window.addEventListener('civicai:session-expired', handleExpired)
    return () => window.removeEventListener('civicai:session-expired', handleExpired)
  }, [])

  const value = useMemo(() => ({
    accessToken,
    user,
    role: user?.role || getRoleFromToken(accessToken),
    isAuthenticated: Boolean(accessToken),
    loginCitizen,
    loginOfficial,
    logout,
  }), [accessToken, user, loginCitizen, loginOfficial, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
