import { apiFetch } from './client';
import type { Barangay } from '@/types/barangay';

export const barangayApi = {
  getBarangays: () => apiFetch<Barangay[]>('/barangays', { withAuth: false }),
  validateCode: (code: string) => apiFetch<Barangay>('/barangays/validate-code', {
    method: 'POST', withAuth: false, body: JSON.stringify({ code }),
  }),
};
