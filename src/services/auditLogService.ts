import apiClient from './apiClient'
import type { ApiResponse } from './authService'
import type { PaginatedData, PageQuery } from './documentService'

export interface AuditLogItem {
  id: number
  userId: string
  userName: string
  action: string
  entityType: string
  entityId: number
  details: string
  createdAt: string
}

export interface AuditLogQuery extends PageQuery {
  userId?: string
  action?: string
}

export const getAuditLogs = async (q?: AuditLogQuery) => {
  const params: Record<string, unknown> = {}
  if (q?.page !== undefined) params.page = q.page
  if (q?.size !== undefined) params.size = q.size
  if (q?.sort !== undefined) params.sort = q.sort
  if (q?.userId) params.userId = q.userId
  if (q?.action) params.action = q.action
  const response = await apiClient.get<ApiResponse<PaginatedData<AuditLogItem>>>(
    '/api/audit-logs',
    { params }
  )
  return response.data
}
