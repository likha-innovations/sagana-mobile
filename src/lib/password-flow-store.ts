// Short-lived in-memory storage for change-password verification flow
let pendingCurrentPassword: string | null = null;

export const setPendingCurrentPassword = (password: string): void => {
  pendingCurrentPassword = password;
};

export const getPendingCurrentPassword = (): string | null => {
  return pendingCurrentPassword;
};

export const clearPendingCurrentPassword = (): void => {
  pendingCurrentPassword = null;
};
