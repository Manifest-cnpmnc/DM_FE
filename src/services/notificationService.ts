import apiClient from './apiClient'
import type { ApiResponse } from './authService'
import type { PaginatedData } from './documentService'

export interface NotificationItem {
  id: number
  message: string
  type: string
  read: boolean
  createdAt: string
}

export const getNotifications = async (page = 0, size = 20) => {
  const response = await apiClient.get<ApiResponse<PaginatedData<NotificationItem>>>('/api/notifications', {
    params: { page, size },
  })
  return response.data
}

export const markAsRead = async (id: number) => {
  const response = await apiClient.put<ApiResponse<void>>(`/api/notifications/${id}/read`)
  return response.data
}
