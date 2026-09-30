import { apiFetch } from './client';
import type { Barangay } from '@/types/barangay';

export const barangayApi = {
  getBarangays: () => apiFetch<Barangay[]>('/barangays', { withAuth: false }),
};
