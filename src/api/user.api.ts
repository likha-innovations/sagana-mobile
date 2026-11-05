import { api } from './client';
import { User, UpdateProfileInput } from '@/types';

export const userApi = {
  // GET /me — Fetches current authenticated user profile
  getProfile: () => api.get<User>('/me'),

  assignBarangay: (code: string, token?: string) => api.post<{ id: string; name: string }>('/me/barangay-code', { code }, token ? { withAuth: false, headers: { Authorization: `Bearer ${token}` } } : undefined),

  // PATCH /me — Updates current authenticated user profile
  updateProfile: (data: UpdateProfileInput, token?: string) => api.patch<User>('/me', data, token ? { withAuth: false, headers: { Authorization: `Bearer ${token}` } } : undefined),
};
