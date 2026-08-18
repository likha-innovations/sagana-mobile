import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/user.api';
import { UpdateProfileInput } from '@/types';
import { logger } from '@/lib/logger';

// Structured Query Keys Factory for User
export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

// Hook to fetch current user profile from GET /me
export function useProfile() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      logger.info('Fetching current user profile from GET /me', 'useProfile');
      return userApi.getProfile();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

// Hook to update current user profile via PATCH /me
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      logger.info('Updating user profile via PATCH /me', 'useUpdateProfile', data);
      return userApi.updateProfile(data);
    },
    onSuccess: (updatedUser) => {
      logger.info('Profile updated successfully in backend', 'useUpdateProfile');
      queryClient.setQueryData(userKeys.profile(), updatedUser);
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
    onError: (error) => {
      logger.error('Failed to update profile in backend', error, 'useUpdateProfile');
    },
  });
}
