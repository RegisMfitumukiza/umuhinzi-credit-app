import env from '../config/env'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: Method
  body?: unknown
  headers?: Record<string, string>
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${env.API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new ApiError(response.status, error.message ?? 'Something went wrong')
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', headers }),

  post: <T>(endpoint: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'POST', body, headers }),

  put: <T>(endpoint: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'PUT', body, headers }),

  patch: <T>(endpoint: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'PATCH', body, headers }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'DELETE', headers }),
}
