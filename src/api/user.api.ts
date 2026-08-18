import { api } from './client';
import { User, UpdateProfileInput } from '@/types';

// User & Profile REST API Endpoints (sagana-backend UsersController)
export const userApi = {
  // GET /me — Fetches current authenticated user profile
  getProfile: () => api.get<User>('/me'),

  // PATCH /me — Updates current authenticated user profile
  updateProfile: (data: UpdateProfileInput) => api.patch<User>('/me', data),
};
