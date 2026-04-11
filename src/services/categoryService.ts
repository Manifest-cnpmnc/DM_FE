import apiClient from './apiClient'
import type { ApiResponse } from './authService'

export interface CategoryItem {
  id: number
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export const getCategories = async () => {
  const response = await apiClient.get<ApiResponse<CategoryItem[]>>('/api/categories')
  return response.data
}

export const getCategoryById = async (id: number) => {
  const response = await apiClient.get<ApiResponse<CategoryItem>>(`/api/categories/${id}`)
  return response.data
}

export const createCategory = async (data: { name: string; description: string }) => {
  const response = await apiClient.post<ApiResponse<CategoryItem>>('/api/categories', data)
  return response.data
}

export const updateCategory = async (id: number, data: { name: string; description: string }) => {
  const response = await apiClient.put<ApiResponse<CategoryItem>>(`/api/categories/${id}`, data)
  return response.data
}

export const deleteCategory = async (id: number) => {
  const response = await apiClient.delete<ApiResponse<void>>(`/api/categories/${id}`)
  return response.data
}
