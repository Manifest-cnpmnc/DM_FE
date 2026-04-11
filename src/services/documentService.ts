import apiClient from './apiClient'

export interface DocumentItem {
  id: number
  title: string
  description: string
  categoryId: number
  categoryName: string
  status: string
  tags: string[]
  createdById: string
  createdByName: string
  latestFileUrl: string
  latestVersion: number
  createdAt: string
  updatedAt: string
}

export interface Pageable {
  paged: boolean
  pageNumber: number
  pageSize: number
  offset: number
  sort: {
    sorted: boolean
    empty: boolean
    unsorted: boolean
  }
  unpaged: boolean
}

export interface PaginatedData<T> {
  totalElements: number
  totalPages: number
  pageable: Pageable
  size: number
  content: T[]
  number: number
  sort: {
    sorted: boolean
    empty: boolean
    unsorted: boolean
  }
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const getDocuments = async (
  query?: {
    title?: string
    categoryId?: number
    status?: string
    from?: string
    to?: string
    tags?: string[]
    page?: number
    size?: number
    sort?: string[]
  }
) => {
  const response = await apiClient.get<ApiResponse<PaginatedData<DocumentItem>>>('/api/documents', {
    params: query,
    headers: {
      Accept: 'application/json',
    },
  })
  return response.data
}

export const downloadDocument = async (id: number) => {
  const response = await apiClient.get<Blob>(`/api/documents/${id}/download`, {
    responseType: 'blob',
    headers: {
      Accept: '*/*',
    },
  })
  return response.data
}

export const downloadDocumentVersion = async (id: number, versionNumber: number) => {
  const response = await apiClient.get<Blob>(`/api/documents/${id}/versions/${versionNumber}/download`, {
    responseType: 'blob',
    headers: {
      Accept: '*/*',
    },
  })
  return response.data
}

export const getDocumentById = async (id: number) => {
  const response = await apiClient.get<ApiResponse<DocumentItem>>(`/api/documents/${id}`)
  return response.data
}

export const uploadDocument = async (file: File, params: {
  title: string
  description?: string
  categoryId: number
  tags?: string[]
}) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post<ApiResponse<DocumentItem>>('/api/documents', formData, {
    params,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const updateDocument = async (id: number, data: {
  title: string
  description?: string
  categoryId: number
  tags?: string[]
}) => {
  const response = await apiClient.put<ApiResponse<DocumentItem>>(`/api/documents/${id}`, data)
  return response.data
}

export const deleteDocument = async (id: number) => {
  const response = await apiClient.delete<ApiResponse<void>>(`/api/documents/${id}`)
  return response.data
}

export const submitDocument = async (id: number, comment?: string) => {
  const response = await apiClient.post<ApiResponse<DocumentItem>>(`/api/documents/${id}/submit`, { comment })
  return response.data
}

export const approveDocument = async (id: number, comment?: string) => {
  const response = await apiClient.post<ApiResponse<DocumentItem>>(`/api/documents/${id}/approve`, { comment })
  return response.data
}

export const rejectDocument = async (id: number, comment?: string) => {
  const response = await apiClient.post<ApiResponse<DocumentItem>>(`/api/documents/${id}/reject`, { comment })
  return response.data
}

export const archiveDocument = async (id: number, comment?: string) => {
  const response = await apiClient.post<ApiResponse<DocumentItem>>(`/api/documents/${id}/archive`, { comment })
  return response.data
}

export interface DocumentVersion {
  id: number
  versionNumber: number
  fileUrl: string
  comment: string
  createdByName: string
  createdAt: string
}

export const getDocumentVersions = async (id: number) => {
  const response = await apiClient.get<ApiResponse<DocumentVersion[]>>(`/api/documents/${id}/versions`)
  return response.data
}

export const uploadNewVersion = async (id: number, file: File, comment?: string) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post<ApiResponse<DocumentVersion>>(`/api/documents/${id}/versions`, formData, {
    params: { comment },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const rollbackDocument = async (id: number, targetVersion: number, reason?: string) => {
  const response = await apiClient.post<ApiResponse<DocumentVersion>>(`/api/documents/${id}/rollback`, null, {
    params: { targetVersion, reason },
  })
  return response.data
}

export interface WorkflowHistoryItem {
  id: number
  action: string
  comment: string
  performedByName: string
  createdAt: string
}

export const getWorkflowHistory = async (id: number) => {
  const response = await apiClient.get<ApiResponse<WorkflowHistoryItem[]>>(`/api/documents/${id}/workflow-history`)
  return response.data
}
