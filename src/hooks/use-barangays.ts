import { useQuery } from '@tanstack/react-query';
import { barangayApi } from '@/api/barangays.api';

export const barangayKeys = {
  all: ['barangays'] as const,
};

export function useBarangays() {
  return useQuery({
    queryKey: barangayKeys.all,
    queryFn: barangayApi.getBarangays,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1, // Only retry once to fail fast
  });
}
