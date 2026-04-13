import apiClient from './apiClient'
import type { ApiResponse } from './authService'

export type DocumentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'
export type DocumentVisibility = 'PRIVATE' | 'ORG_INTERNAL' | 'ORG_PUBLIC'

export interface DocumentItem {
  id: number
  title: string
  description: string
  categoryId: number
  categoryName: string
  status: DocumentStatus
  visibility: DocumentVisibility
  organizationId: string | null
  organizationName: string | null
  tags: string[]
  createdById: string
  createdByName: string
  latestVersion: number
  createdAt: string
  updatedAt: string
}

export interface DocumentVersion {
  id: number
  versionNumber: number
  fileName: string
  fileType: string
  fileSize: number
  comment: string
  uploadedById: string
  uploadedByName: string
  createdAt: string
}

export interface WorkflowHistoryItem {
  id: number
  fromStatus: string
  toStatus: string
  comment: string
  performedById: string
  performedByName: string
  createdAt: string
}

export interface PaginatedData<T> {
  totalElements: number
  totalPages: number
  size: number
  number: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
  content: T[]
}

export interface PageQuery {
  page?: number
  size?: number
  sort?: string | string[]
}

export interface DocumentUploadParams {
  title: string
  description?: string
  categoryId?: number
  tags?: string[]
  organizationId?: string
  visibility?: DocumentVisibility
}

export interface DocumentUpdateRequest {
  title: string
  description?: string
  categoryId?: number
  tags?: string[]
  organizationId?: string
  visibility?: DocumentVisibility
}

const buildPageParams = (q?: PageQuery): Record<string, unknown> => {
  if (!q) return {}
  const params: Record<string, unknown> = {}
  if (q.page !== undefined) params.page = q.page
  if (q.size !== undefined) params.size = q.size
  if (q.sort !== undefined) params.sort = q.sort
  return params
}

export const getDocuments = async (q?: PageQuery) => {
  const response = await apiClient.get<ApiResponse<PaginatedData<DocumentItem>>>('/api/documents', {
    params: buildPageParams(q),
  })
  return response.data
}

export const getPersonalDocuments = async (q?: PageQuery) => {
  const response = await apiClient.get<ApiResponse<PaginatedData<DocumentItem>>>(
    '/api/documents/personal',
    { params: buildPageParams(q) }
  )
  return response.data
}

export const getOrganizationDocuments = async (orgId: string, q?: PageQuery) => {
  const response = await apiClient.get<ApiResponse<PaginatedData<DocumentItem>>>(
    `/api/documents/organization/${orgId}`,
    { params: buildPageParams(q) }
  )
  return response.data
}

export const getDocumentById = async (id: number) => {
  const response = await apiClient.get<ApiResponse<DocumentItem>>(`/api/documents/${id}`)
  return response.data
}

export const uploadDocument = async (file: File, params: DocumentUploadParams) => {
  const formData = new FormData()
  formData.append('file', file)
  const query: Record<string, unknown> = { title: params.title }
  if (params.description) query.description = params.description
  if (params.categoryId !== undefined) query.categoryId = params.categoryId
  if (params.tags && params.tags.length) query.tags = params.tags
  if (params.organizationId) query.organizationId = params.organizationId
  if (params.visibility) query.visibility = params.visibility
  const response = await apiClient.post<ApiResponse<DocumentItem>>('/api/documents', formData, {
    params: query,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const updateDocument = async (id: number, data: DocumentUpdateRequest) => {
  const response = await apiClient.put<ApiResponse<DocumentItem>>(`/api/documents/${id}`, data)
  return response.data
}

export const deleteDocument = async (id: number) => {
  const response = await apiClient.delete<ApiResponse<void>>(`/api/documents/${id}`)
  return response.data
}

export const getDocumentDownloadUrl = async (id: number) => {
  const response = await apiClient.get<ApiResponse<string>>(`/api/documents/${id}/download`)
  return response.data.data
}

export const getDocumentVersionDownloadUrl = async (id: number, versionNumber: number) => {
  const response = await apiClient.get<ApiResponse<string>>(
    `/api/documents/${id}/versions/${versionNumber}/download`
  )
  return response.data.data
}

export const getDocumentVersions = async (id: number) => {
  const response = await apiClient.get<ApiResponse<DocumentVersion[]>>(
    `/api/documents/${id}/versions`
  )
  return response.data
}

export const uploadNewVersion = async (id: number, file: File, comment: string) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post<ApiResponse<DocumentVersion>>(
    `/api/documents/${id}/versions`,
    formData,
    {
      params: { comment },
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )
  return response.data
}

export const rollbackDocument = async (id: number, targetVersion: number, reason?: string) => {
  const response = await apiClient.post<ApiResponse<DocumentVersion>>(
    `/api/documents/${id}/rollback`,
    null,
    { params: { targetVersion, reason } }
  )
  return response.data
}

export const getWorkflowHistory = async (id: number) => {
  const response = await apiClient.get<ApiResponse<WorkflowHistoryItem[]>>(
    `/api/documents/${id}/workflow-history`
  )
  return response.data
}

const workflowAction = async (id: number, action: string, comment?: string) => {
  const response = await apiClient.post<ApiResponse<DocumentItem>>(
    `/api/documents/${id}/${action}`,
    { comment: comment ?? '' }
  )
  return response.data
}

export const submitDocument = (id: number, comment?: string) => workflowAction(id, 'submit', comment)
export const approveDocument = (id: number, comment?: string) => workflowAction(id, 'approve', comment)
export const rejectDocument = (id: number, comment?: string) => workflowAction(id, 'reject', comment)
export const archiveDocument = (id: number, comment?: string) => workflowAction(id, 'archive', comment)
