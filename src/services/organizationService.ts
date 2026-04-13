import apiClient from './apiClient'
import type { ApiResponse } from './authService'
import type { PaginatedData, PageQuery } from './documentService'

export type OrgVisibility = 'PUBLIC' | 'PRIVATE'
export type OrgRole = 'VIEWER' | 'EDITOR' | 'ADMIN' | 'OWNER'

export interface OrganizationItem {
  id: string
  name: string
  slug: string
  description: string
  visibility: OrgVisibility
  ownerId: string
  ownerName: string
  createdAt: string
  updatedAt: string
}

export interface OrganizationMember {
  id: number
  userId: string
  email: string
  fullName: string
  orgRole: OrgRole
  joinedAt: string
}

export interface CreateOrganizationRequest {
  name: string
  slug: string
  description?: string
  visibility: OrgVisibility
}

export interface UpdateOrganizationRequest {
  name: string
  description?: string
  visibility: OrgVisibility
}

export interface AddMemberRequest {
  email: string
  orgRole: OrgRole
}

const buildPageParams = (q?: PageQuery): Record<string, unknown> => {
  if (!q) return {}
  const params: Record<string, unknown> = {}
  if (q.page !== undefined) params.page = q.page
  if (q.size !== undefined) params.size = q.size
  if (q.sort !== undefined) params.sort = q.sort
  return params
}

export const listAllOrganizations = async (q?: PageQuery) => {
  const response = await apiClient.get<ApiResponse<PaginatedData<OrganizationItem>>>(
    '/api/organizations',
    { params: buildPageParams(q) }
  )
  return response.data
}

export const listPublicOrganizations = async (q?: PageQuery) => {
  const response = await apiClient.get<ApiResponse<PaginatedData<OrganizationItem>>>(
    '/api/organizations/public',
    { params: buildPageParams(q) }
  )
  return response.data
}

export const listMyOrganizations = async (q?: PageQuery) => {
  const response = await apiClient.get<ApiResponse<PaginatedData<OrganizationItem>>>(
    '/api/organizations/me',
    { params: buildPageParams(q) }
  )
  return response.data
}

export const getOrganization = async (id: string) => {
  const response = await apiClient.get<ApiResponse<OrganizationItem>>(`/api/organizations/${id}`)
  return response.data
}

export const createOrganization = async (data: CreateOrganizationRequest) => {
  const response = await apiClient.post<ApiResponse<OrganizationItem>>('/api/organizations', data)
  return response.data
}

export const updateOrganization = async (id: string, data: UpdateOrganizationRequest) => {
  const response = await apiClient.put<ApiResponse<OrganizationItem>>(
    `/api/organizations/${id}`,
    data
  )
  return response.data
}

export const deleteOrganization = async (id: string) => {
  const response = await apiClient.delete<ApiResponse<void>>(`/api/organizations/${id}`)
  return response.data
}

export const listOrganizationMembers = async (id: string) => {
  const response = await apiClient.get<ApiResponse<OrganizationMember[]>>(
    `/api/organizations/${id}/members`
  )
  return response.data
}

export const addOrganizationMember = async (id: string, data: AddMemberRequest) => {
  const response = await apiClient.post<ApiResponse<OrganizationMember>>(
    `/api/organizations/${id}/members`,
    data
  )
  return response.data
}

export const updateOrganizationMemberRole = async (
  id: string,
  userId: string,
  orgRole: OrgRole
) => {
  const response = await apiClient.put<ApiResponse<OrganizationMember>>(
    `/api/organizations/${id}/members/${userId}`,
    { orgRole }
  )
  return response.data
}

export const removeOrganizationMember = async (id: string, userId: string) => {
  const response = await apiClient.delete<ApiResponse<void>>(
    `/api/organizations/${id}/members/${userId}`
  )
  return response.data
}
