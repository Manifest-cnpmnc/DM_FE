import apiClient from './apiClient'

export interface AuthResponseData {
  token: string
  type: string
  id: string
  email: string
  fullName: string
  role: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

const STORAGE_TOKEN_KEY = 'authToken'
const STORAGE_USER_KEY = 'authUser'

export const login = async (email: string, password: string) => {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>(
    '/api/auth/login',
    {
      email,
      password,
    },
    {
      headers: {
        Accept: 'application/json',
      },
    }
  )

  const { token, fullName, role, id, email: userEmail } = response.data.data
  localStorage.setItem(STORAGE_TOKEN_KEY, token)
  localStorage.setItem(
    STORAGE_USER_KEY,
    JSON.stringify({ fullName, role, id, email: userEmail })
  )

  return response.data
}

export const register = async (
  email: string,
  password: string,
  fullName: string,
  phone: string
) => {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>('/api/auth/register', {
    email,
    password,
    fullName,
    phone,
    role: 'user',
  })

  return response.data
}

export const getRoles = async () => {
  const response = await apiClient.get<ApiResponse<string[]>>('/api/auth/roles')
  return response.data.data
}

export const logout = () => {
  localStorage.removeItem(STORAGE_TOKEN_KEY)
  localStorage.removeItem(STORAGE_USER_KEY)
}

export const getAuthToken = () => localStorage.getItem(STORAGE_TOKEN_KEY)

export const getAuthUser = () => {
  const raw = localStorage.getItem(STORAGE_USER_KEY)
  return raw ? JSON.parse(raw) : null
}
