# State Management (TanStack Query)

Sagana Mobile uses **TanStack Query v5** (`@tanstack/react-query`) for all server state caching, background synchronization, and optimistic UI updates.

---

## 🔑 Structured Query Key Factories

To maintain type safety and avoid cache key collisions, query keys are structured into factory objects:

```typescript
export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};
```

---

## 📥 Queries: Fetching Server Data

Query hooks encapsulate fetch operations, refetch interval logic, and error handlers:

```typescript
import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/api';

export function useProfileQuery(enabled = true) {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: () => userApi.getProfile(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });
}
```

---

## 📤 Mutations & Cache Invalidation

Mutations handle write operations and automatically invalidate related caches upon success:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api';
import * as Burnt from 'burnt';

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileInput) => userApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Invalidate or update query cache directly
      queryClient.setQueryData(userKeys.profile(), updatedUser);
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });

      Burnt.toast({
        title: 'Profile Updated',
        message: 'Your account changes have been saved.',
        preset: 'done',
      });
    },
    onError: (error) => {
      Burnt.toast({
        title: 'Update Failed',
        message: error.message,
        preset: 'error',
      });
    },
  });
}
```
