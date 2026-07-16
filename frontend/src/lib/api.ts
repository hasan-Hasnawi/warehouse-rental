import { addToQueue } from './offline-queue'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null
}

function headers(token: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers(token), ...(options.headers as any) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new ApiError(res.status, body.message || 'Request failed')
  }
  return res.json()
}

let offlineCallback: ((count: number) => void) | null = null

export function onOfflineChange(cb: (count: number) => void) {
  offlineCallback = cb
}

async function mutate<T>(path: string, options: RequestInit, opType: string): Promise<T> {
  const token = await getToken()
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers(token), ...(options.headers as any) },
    })
    if (!res.ok) {
      if (res.status === 0 || !navigator.onLine) {
        throw new TypeError('Network error')
      }
      const body = await res.json().catch(() => ({ message: 'Request failed' }))
      throw new ApiError(res.status, body.message || 'Request failed')
    }
    return res.json()
  } catch (err: any) {
    if (err instanceof TypeError || !navigator.onLine) {
      const body = options.body ? JSON.parse(options.body as string) : undefined
      const offlineId = addToQueue({ type: opType, endpoint: path, method: options.method || 'POST', body })
      if (offlineCallback) offlineCallback(1)
      return { queued: true, offlineId } as any
    }
    throw err
  }
}

export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      request<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    profile: () => request<any>('/auth/profile'),
    updateProfile: (data: any) => mutate<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }, 'profile:update'),
  },
  groups: {
    list: () => request<any[]>('/groups'),
    getById: (id: string) => request<any>(`/groups/${id}`),
    create: (data: any) => mutate<any>('/groups', { method: 'POST', body: JSON.stringify(data) }, 'group:create'),
    update: (id: string, data: any) => mutate<any>(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }, 'group:update'),
    delete: (id: string) => mutate<any>(`/groups/${id}`, { method: 'DELETE' }, 'group:delete'),
  },
  warehouses: {
    list: (params?: string) => request<any[]>(`/warehouses${params ? `?${params}` : ''}`),
    getById: (id: string) => request<any>(`/warehouses/${id}`),
    create: (data: any) => mutate<any>('/warehouses', { method: 'POST', body: JSON.stringify(data) }, 'warehouse:create'),
    update: (id: string, data: any) => mutate<any>(`/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) }, 'warehouse:update'),
    delete: (id: string) => mutate<any>(`/warehouses/${id}`, { method: 'DELETE' }, 'warehouse:delete'),
  },
  contracts: {
    list: (params?: string) => request<any[]>(`/contracts${params ? `?${params}` : ''}`),
    getById: (id: string) => request<any>(`/contracts/${id}`),
    create: (data: any) => mutate<any>('/contracts', { method: 'POST', body: JSON.stringify(data) }, 'contract:create'),
    update: (id: string, data: any) => mutate<any>(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }, 'contract:update'),
    terminate: (id: string) => mutate<any>(`/contracts/${id}/terminate`, { method: 'POST' }, 'contract:terminate'),
    signByTenant: (id: string) => mutate<any>(`/contracts/${id}/sign-tenant`, { method: 'POST' }, 'contract:sign'),
    signByAdmin: (id: string) => mutate<any>(`/contracts/${id}/sign-admin`, { method: 'POST' }, 'contract:sign'),
    expiring: () => request<{ expiring: any[]; expired: any[] }>('/contracts/expiring'),
    deleteContract: (id: string) => mutate<any>(`/contracts/${id}`, { method: 'DELETE' }, 'contract:delete'),
  },
  admin: {
    listUsers: (role?: string) => request<any[]>(`/auth/users${role ? `?role=${role}` : ''}`),
    createUser: (data: any) => mutate<any>('/auth/users', { method: 'POST', body: JSON.stringify(data) }, 'user:create'),
    updateUser: (id: string, data: any) => mutate<any>(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }, 'user:update'),
    deleteUser: (id: string) => mutate<any>(`/auth/users/${id}`, { method: 'DELETE' }, 'user:delete'),
  },
  payments: {
    list: (params?: string) => request<any[]>(`/payments${params ? `?${params}` : ''}`),
    getById: (id: string) => request<any>(`/payments/${id}`),
    create: (data: any) => mutate<any>('/payments', { method: 'POST', body: JSON.stringify(data) }, 'payment:create'),
    dashboard: () => request<any>('/payments/dashboard'),
    dashboardDetails: (params?: string) => request<any>(`/payments/details${params ? `?${params}` : ''}`),
    getMethods: () => request<any[]>('/payments/methods'),
    pay: (paymentId: string, method: string) =>
      mutate<{ success: boolean; referenceNo: string; message: string }>('/payments/pay', {
        method: 'POST',
        body: JSON.stringify({ paymentId, method }),
      }, 'payment:pay'),
    markAsPaid: (id: string) => mutate<any>(`/payments/${id}/mark-paid`, { method: 'POST' }, 'payment:markPaid'),
    cancel: (id: string) => mutate<any>(`/payments/${id}/cancel`, { method: 'POST' }, 'payment:cancel'),
  },
  guards: {
    logAccess: (data: any) => mutate<any>('/guards/access', { method: 'POST', body: JSON.stringify(data) }, 'guard:access'),
    getAccessLogs: () => request<any[]>('/guards/access'),
    createReport: (data: any) => mutate<any>('/guards/reports', { method: 'POST', body: JSON.stringify(data) }, 'guard:report'),
    getReports: () => request<any[]>('/guards/reports'),
    createCollection: (data: any) => mutate<any>('/guards/collections', { method: 'POST', body: JSON.stringify(data) }, 'guard:collection'),
    getCollections: () => request<any[]>('/guards/collections'),
    generateQR: (contractId: string) => request<{ qrCode: string; contract: any }>(`/guards/qr/${contractId}`),
    tasks: {
      list: (guardId?: string) => request<any[]>(`/guards/tasks${guardId ? `?guardId=${guardId}` : ''}`),
      create: (data: any) => mutate<any>('/guards/tasks', { method: 'POST', body: JSON.stringify(data) }, 'task:create'),
      updateStatus: (id: string, status: string) => mutate<any>(`/guards/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }, 'task:update'),
    },
  },
  tenants: {
    search: (q: string) => request<{ id: string; name: string; phone: string | null; phone2: string | null }[]>(`/tenants/search?q=${encodeURIComponent(q)}`),
    list: () => request<any[]>('/tenants'),
    getById: (id: string) => request<any>(`/tenants/${id}`),
    create: (data: any) => mutate<any>('/tenants', { method: 'POST', body: JSON.stringify(data) }, 'tenant:create'),
  },
  notifications: {
    list: (params?: string) => request<any[]>(`/notifications${params ? `?${params}` : ''}`),
    unreadCount: () => request<{ count: number }>('/notifications/unread-count'),
    markAsRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllAsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),
    delete: (ids: string[]) => request<any>('/notifications/delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  },
}
