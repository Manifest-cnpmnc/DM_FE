import apiClient from './apiClient'
import type { ApiResponse } from './authService'

export interface UserItem {
  id: string
  email: string
  fullName: string
  phone: string
  role: string
  createdAt: string
}

export interface CreateUserRequest {
  email: string
  password: string
  fullName: string
  phone?: string
  role?: string
}

export interface UpdateProfileRequest {
  fullName: string
  phone: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export const getUsers = async () => {
  const response = await apiClient.get<ApiResponse<UserItem[]>>('/api/users')
  return response.data
}

export const createUser = async (data: CreateUserRequest) => {
  const response = await apiClient.post<ApiResponse<UserItem>>('/api/users', data)
  return response.data
}

export const deleteUser = async (id: string) => {
  const response = await apiClient.delete<ApiResponse<void>>(`/api/users/${id}`)
  return response.data
}

export const updateUserRole = async (id: string, role: string) => {
  const response = await apiClient.put<ApiResponse<UserItem>>(`/api/users/${id}/role`, null, {
    params: { role },
  })
  return response.data
}

export const getProfile = async () => {
  const response = await apiClient.get<ApiResponse<UserItem>>('/api/users/profile')
  return response.data
}

export const updateProfile = async (data: UpdateProfileRequest) => {
  const response = await apiClient.put<ApiResponse<UserItem>>('/api/users/profile', data)
  return response.data
}

export const changePassword = async (data: ChangePasswordRequest) => {
  const response = await apiClient.put<ApiResponse<void>>('/api/users/profile/password', data)
  return response.data
}
