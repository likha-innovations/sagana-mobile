import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/api/user.api";
import { UpdateProfileInput } from "@/types";
import { createLogger } from "@/lib/logger";
import { useAuthContext } from "@/context/auth-context";

const logger = createLogger("useProfile");

// Structured Query Keys Factory for User
export const userKeys = {
  all: ["user"] as const,
  profile: (userId?: string) => [...userKeys.all, userId, "profile"] as const,
};

// Hook to fetch current user profile from GET /me
export function useProfile() {
  const { user, isLoaded, isSignedIn } = useAuthContext();
  return useQuery({
    queryKey: userKeys.profile(user?.id),
    enabled: isLoaded && isSignedIn && !!user?.id,
    queryFn: async () => {
      logger.info("Fetching current user profile from GET /me");
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
      logger.info("Updating user profile via PATCH /me", data);
      return userApi.updateProfile(data);
    },
    onSuccess: async (updatedUser) => {
      logger.info("Profile updated successfully in backend");
      await queryClient.cancelQueries({ queryKey: ["machines"] });
      queryClient.removeQueries({ queryKey: ["machines"] });
      queryClient.setQueryData(userKeys.profile(updatedUser.id), updatedUser);
      queryClient.invalidateQueries({
        queryKey: userKeys.profile(updatedUser.id),
      });
    },
    onError: (error) => {
      logger.error("Failed to update profile in backend", error);
    },
  });
}
