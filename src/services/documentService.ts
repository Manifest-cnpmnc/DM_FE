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

export const uploadDocument = async (formData: FormData) => {
  const response = await apiClient.post<ApiResponse<DocumentItem>>('/api/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
