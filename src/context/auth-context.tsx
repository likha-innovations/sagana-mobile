import { createContext, useContext, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/expo';
import { useSignIn } from '@clerk/expo/legacy';
import { useRouter } from 'expo-router';
import {
  User,
  signInSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
} from '@/types';
import { setAuthTokenGetter } from '@/lib/auth-token';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AuthContext');

interface AuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  user: User | null;
  getToken: () => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (code: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isSignedIn, isLoaded: authLoaded, signOut: clerkSignOut, getToken } = useAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { signIn: clerkSignIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();

  const isLoaded = authLoaded && userLoaded && signInLoaded;

  // Automatically wire Clerk's active JWT getter into native apiFetch
  useEffect(() => {
    setAuthTokenGetter(getToken);
  }, [getToken]);

  // Normalized user object aligned with Prisma User model
  const user: User | null = useMemo(() => {
    if (!clerkUser) return null;
    const metadata = (clerkUser.unsafeMetadata || {}) as Record<string, any>;
    return {
      id: clerkUser.id,
      fullName: clerkUser.fullName || metadata.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      contactNumber: metadata.contactNumber || null,
      location: metadata.location || null,
    };
  }, [clerkUser]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!clerkSignIn) throw new Error('Sign-in service unavailable');

      // Zod validation
      const validated = signInSchema.parse({ email, password });

      const attempt = await clerkSignIn.create({
        identifier: validated.email,
        password: validated.password,
      });

      if (attempt.status === 'complete') {
        logger.info('User signed in');
        await setSignInActive({ session: attempt.createdSessionId });
        router.replace('/(app)/(tabs)');
        return;
      }

      logger.warn('Sign in incomplete', attempt);

      throw new Error(`Sign-in incomplete (status: ${attempt.status}).`);
    },
    [clerkSignIn, setSignInActive, router]
  );

  const requestPasswordReset = useCallback(
    async (email: string) => {
      if (!clerkSignIn) throw new Error('Sign-in service unavailable');

      // Zod validation
      const validated = resetPasswordRequestSchema.parse({ email });

      await clerkSignIn.create({
        strategy: 'reset_password_email_code',
        identifier: validated.email,
      });
      logger.info('Password reset email sent');
    },
    [clerkSignIn]
  );

  const resetPassword = useCallback(
    async (code: string, newPassword: string) => {
      if (!clerkSignIn) throw new Error('Sign-in service unavailable');

      // Zod validation
      const validated = resetPasswordConfirmSchema.parse({ code, password: newPassword });

      const result = await clerkSignIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: validated.code,
        password: validated.password,
      });

      if (result.status === 'complete') {
        logger.info('Password reset complete');
        await setSignInActive({ session: result.createdSessionId });
        router.replace('/(app)/(tabs)');
      } else {
        logger.warn('Password reset incomplete', result);
        throw new Error('Password reset incomplete. Please try again.');
      }
    },
    [clerkSignIn, setSignInActive, router]
  );

  const signOut = useCallback(async () => {
    try {
      logger.info('Signing out user');
      await clerkSignOut();
      router.replace('/(auth)/sign-in');
    } catch (err: unknown) {
      logger.error('Sign out error', err);
      throw err;
    }
  }, [clerkSignOut, router]);

  const value = useMemo<AuthContextType>(
    () => ({
      isSignedIn: !!isSignedIn,
      isLoaded,
      user,
      getToken,
      signIn,
      requestPasswordReset,
      resetPassword,
      signOut,
    }),
    [
      isSignedIn,
      isLoaded,
      user,
      getToken,
      signIn,
      requestPasswordReset,
      resetPassword,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
