import apiClient from './apiClient'
import type { ApiResponse } from './authService'
import type { PaginatedData, PageQuery } from './documentService'

export interface NotificationItem {
  id: number
  message: string
  type: string
  read: boolean
  createdAt: string
}

export const getNotifications = async (q?: PageQuery) => {
  const params: Record<string, unknown> = {}
  if (q?.page !== undefined) params.page = q.page
  if (q?.size !== undefined) params.size = q.size
  if (q?.sort !== undefined) params.sort = q.sort
  const response = await apiClient.get<ApiResponse<PaginatedData<NotificationItem>>>(
    '/api/notifications',
    { params }
  )
  return response.data
}

export const markAsRead = async (id: number) => {
  const response = await apiClient.put<ApiResponse<void>>(`/api/notifications/${id}/read`)
  return response.data
}
