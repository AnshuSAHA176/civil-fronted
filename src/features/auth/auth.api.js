import { apiClient } from '../../services/apiClient'

export const citizenLogin = (payload) => apiClient.post('/login/', payload)
export const citizenRegister = (payload) => apiClient.post('/register/', payload)
export const officialLogin = (payload) => apiClient.post('/official_user_login/', payload)
export const officialRegister = (payload) => apiClient.post('/official_user_register/', payload)
export const getProfile = () => apiClient.get('/profile/')

/**
 * The backend's official-login response contains only JWT access/refresh tokens.
 * Its default JWT payload does not include the user's role, and /profile/ only
 * supports all three implemented application roles. We use the role-specific
 * HOD dashboard first because profile data alone does not identify the role.
 */
export async function discoverOfficialRole(accessToken) {
  const authConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  }

  // HODs now have a supported /profile/ response too, so profile-first
  // detection would incorrectly classify HODs as officers. Check the
  // role-specific dashboard first; an Officer is rejected there.
  try {
    await apiClient.get('/HOD_dashbord/', authConfig)
    return 'department_head'
  } catch (hodError) {
    const status = hodError.response?.status
    if (status !== 403 && status !== 404) throw hodError
  }

  try {
    await apiClient.get('/profile/', authConfig)
    return 'officer'
  } catch (profileError) {
    throw new Error(
      'Your account authenticated successfully, but CivicAI could not determine an official role supported by this frontend. Admin and auditor role routing is not exposed by the current backend.',
    )
  }
}
