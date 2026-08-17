import { ROLES } from '../utils/constants'

export const roleHome = {
  [ROLES.CITIZEN]: '/citizen/dashboard',
  [ROLES.OFFICER]: '/officer/dashboard',
  [ROLES.HOD]: '/hod/dashboard',
  [ROLES.ADMIN]: '/unauthorized',
  [ROLES.AUDITOR]: '/unauthorized',
}
