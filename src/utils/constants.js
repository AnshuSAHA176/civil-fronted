export const ROLES = Object.freeze({
  CITIZEN: 'citizen',
  OFFICER: 'officer',
  HOD: 'department_head',
  ADMIN: 'admin',
  AUDITOR: 'auditor',
})

export const COMPLAINT_STATUSES = Object.freeze([
  'pending',
  'assigned',
  'accepted',
  'inspection',
  'in_progress',
  'resolved',
  'closed',
  'rejected',
  'reopened',
])
