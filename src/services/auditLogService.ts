import apiClient from './apiClient'
import type { ApiResponse } from './authService'
import type { PaginatedData } from './documentService'

export interface AuditLogItem {
  id: number
  userId: string
  userName: string
  action: string
  entityType: string
  entityId: string
  details: string
  createdAt: string
}

export const getAuditLogs = async (query?: {
  userId?: string
  action?: string
  page?: number
  size?: number
}) => {
  const response = await apiClient.get<ApiResponse<PaginatedData<AuditLogItem>>>('/api/audit-logs', {
    params: query,
  })
  return response.data
}
