import { apiClient } from '../services/apiClient'

export const sendAssistantMessage = (content) =>
  apiClient.post('/agent/chat/', { content })

export const resumeAssistantApproval = (approval) =>
  apiClient.post('/agent/chat/', { resume_approval: approval })
