import { createContext, useContext, useCallback, useMemo, useEffect, useState, type ReactNode } from 'react';
import { useAuth, useClerk, useUser, useSSO } from '@clerk/expo';
import { useSignIn, useSignUp } from '@clerk/expo/legacy';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import {
  User,
  ApiError,
  signInSchema,
  verifyCodeSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
} from '@/types';
import { setAuthTokenGetter } from '@/lib/auth-token';
import { disconnectSocket } from '@/lib/socket';
import { createLogger } from '@/lib/logger';
import { userApi } from '@/api/user.api';

WebBrowser.maybeCompleteAuthSession();

const logger = createLogger('AuthContext');

export interface GoogleAuthResult {
  isNewUserOrIncomplete: boolean;
  firstName?: string;
  lastName?: string;
}

export class InvalidBarangayCodeError extends Error {}
export class MissingSignupRequirementsError extends Error {
  constructor(readonly missingFields: string[], readonly unverifiedFields: string[]) {
    super('Additional signup requirements must be completed');
  }
}

interface AuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  user: User | null;
  clerkUser: any;
  signupBarangay: { id: string; name: string; code: string } | null;
  setSignupBarangay: (value: { id: string; name: string; code: string } | null) => void;
  getToken: () => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<GoogleAuthResult>;
  signUp: (email: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  completeSignUp: (firstName: string, lastName: string, birthday: string, barangayId: string, barangayName: string, password?: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<void>;
  verifyPasswordResetCode: (code: string) => Promise<void>;
  resetPassword: (codeOrNewPassword: string, maybeNewPassword?: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const clerk = useClerk();
  const { isSignedIn, isLoaded: authLoaded, signOut: clerkSignOut, getToken } = useAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { signIn: clerkSignIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp: clerkSignUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [signupBarangay, setSignupBarangay] = useState<{ id: string; name: string; code: string } | null>(null);

  // Warm up browser engine for fast OAuth presentation
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const isLoaded = authLoaded && userLoaded && signInLoaded && Boolean(signUpLoaded);

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
      barangay: metadata.barangayName || metadata.barangay || null,
      birthday: metadata.birthday || null,
    };
  }, [clerkUser]);

  const signInWithGoogle = useCallback(async (): Promise<GoogleAuthResult> => {
    logger.info('Initiating Google SSO flow');
    try {
      const redirectUrl = Linking.createURL('/', { scheme: 'sagana' });
      const { createdSessionId, setActive, signIn: ssoSignIn, signUp: ssoSignUp } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      if (createdSessionId) {
        if (setActive) {
          await setActive({ session: createdSessionId });
        }

        const metadata = (ssoSignUp?.unsafeMetadata || ssoSignIn?.userData || {}) as Record<string, any>;
        const hasBirthday = Boolean(metadata?.birthday);

        if (hasBirthday) {
          logger.info('Google SSO: user already completed profile, navigating to app tabs');
          router.replace('/(app)/(tabs)');
          return { isNewUserOrIncomplete: false };
        }

        logger.info('Google SSO: user needs to confirm name and enter birthday');
        const googleFirstName =
          (ssoSignUp as any)?.firstName ||
          (ssoSignIn as any)?.userData?.firstName ||
          '';
        const googleLastName =
          (ssoSignUp as any)?.lastName ||
          (ssoSignIn as any)?.userData?.lastName ||
          '';

        return {
          isNewUserOrIncomplete: true,
          firstName: googleFirstName,
          lastName: googleLastName,
        };
      }

      if (ssoSignIn) {
        logger.warn('Google SSO sign-in status', ssoSignIn.status);
      }
      if (ssoSignUp) {
        logger.warn('Google SSO sign-up status', ssoSignUp.status);
      }

      return { isNewUserOrIncomplete: false };
    } catch (err: unknown) {
      logger.error('Google SSO flow error', err);
      throw err;
    }
  }, [startSSOFlow, router]);

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

  const verifyPasswordResetCode = useCallback(
    async (code: string) => {
      if (!clerkSignIn) throw new Error('Sign-in service unavailable');

      // Zod validation
      const validated = verifyCodeSchema.parse({ code });

      const result = await clerkSignIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: validated.code,
      });

      if (result.status !== 'needs_new_password' && result.status !== 'complete') {
        logger.warn('Password reset code verification returned unexpected status', result.status);
        throw new Error(
          result.status ? `Verification failed with status: ${result.status}` : 'Verification failed'
        );
      }

      logger.info('Password reset code verified successfully');
    },
    [clerkSignIn]
  );

  const resetPassword = useCallback(
    async (arg1: string, arg2?: string) => {
      if (!clerkSignIn) throw new Error('Sign-in service unavailable');

      let password = arg1;
      let code = arg2?.trim();

      // If called in reverse order: resetPassword(code, password) where arg1 is 6-digit OTP
      if (arg2 && /^\d{6}$/.test(arg1.trim())) {
        code = arg1.trim();
        password = arg2;
      }

      let result;
      // If OTP was pre-verified in Step 2, status is 'needs_new_password'
      if (clerkSignIn.status === 'needs_new_password') {
        result = await clerkSignIn.resetPassword({
          password,
        });
      } else if (code) {
        // Direct combined code + password verification fallback
        const validated = resetPasswordConfirmSchema.parse({ code, password });
        result = await clerkSignIn.attemptFirstFactor({
          strategy: 'reset_password_email_code',
          code: validated.code,
          password: validated.password,
        });
      } else {
        result = await clerkSignIn.resetPassword({
          password,
        });
      }

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

  const updatePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!clerkUser) throw new Error('User not loaded');

      logger.info('Updating password for logged-in user');
      await clerkUser.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions: true,
      });
      logger.info('Password updated successfully');
    },
    [clerkUser]
  );

  const signUp = useCallback(
    async (email: string) => {
      if (!clerkSignUp) throw new Error('Sign-up service unavailable');
      await clerkSignUp.create({ emailAddress: email });
      await clerkSignUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      logger.info('Sign-up initiated, verification code sent');
    },
    [clerkSignUp]
  );

  const verifyEmail = useCallback(
    async (code: string) => {
      if (!clerkSignUp) throw new Error('Sign-up service unavailable');
      const attempt = await clerkSignUp.attemptEmailAddressVerification({ code });
      if (attempt.status !== 'complete') {
        logger.warn('Email verification incomplete', attempt);
      }
      logger.info('Email verified successfully');
    },
    [clerkSignUp]
  );

  const completeSignUp = useCallback(
    async (firstName: string, lastName: string, birthday: string, barangayId: string, barangayName: string, password?: string) => {
      if (signupBarangay && signupBarangay.id !== barangayId) throw new Error('Barangay code required');
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const trimmedBirthday = birthday.trim();
      const trimmedBarangayId = barangayId.trim();
      const trimmedBarangayName = barangayName.trim();

      // If user is already authenticated (e.g. via Google SSO)
      if (clerkUser) {
        logger.info('Updating authenticated user profile metadata');
        await clerkUser.update({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          unsafeMetadata: {
            ...((clerkUser.unsafeMetadata || {}) as Record<string, any>),
            fullName,
            birthday: trimmedBirthday,
            barangay: trimmedBarangayId,
            barangayName: trimmedBarangayName,
          },
        });
        logger.info('Profile confirmed and updated for', fullName);
        if (signupBarangay) {
          try { await userApi.assignBarangay(signupBarangay.code); }
          catch (error) {
            if (error instanceof ApiError && error.statusCode === 400) throw new InvalidBarangayCodeError();
            throw error;
          }
        }
        await userApi.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), birthday: trimmedBirthday });
        return true;
      }

      // If user is in standard sign-up flow before session is active
      if (clerkSignUp) {
        if (!signupBarangay) throw new Error('Barangay code required');
        const attempt = await clerkSignUp.update({
            ...(password ? { password } : {}),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            unsafeMetadata: {
              fullName,
              birthday: trimmedBirthday,
              barangay: trimmedBarangayId,
              barangayName: trimmedBarangayName,
            },
          });

        if (attempt.createdSessionId) {
          await setSignUpActive({ session: attempt.createdSessionId });
          const session = clerk.client?.sessions.find((item) => item.id === attempt.createdSessionId);
          const token = await session?.getToken();
          if (!token) throw new Error('Sign-in session is not ready');
          const withSessionRetry = async <T,>(write: (sessionToken: string) => Promise<T>) => {
            try { return await write(token); }
            catch (error) {
              if (!(error instanceof ApiError) || error.statusCode !== 401) throw error;
              const freshToken = await session?.getToken({ skipCache: true });
              if (!freshToken) throw error;
              return write(freshToken);
            }
          };
          try { await withSessionRetry((sessionToken) => userApi.assignBarangay(signupBarangay.code, sessionToken)); }
          catch (error) {
            if (error instanceof ApiError && error.statusCode === 400) throw new InvalidBarangayCodeError();
            throw error;
          }
          await withSessionRetry((sessionToken) => userApi.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), birthday: trimmedBirthday }, sessionToken));
          return true;
        } else {
          if (attempt.status === 'missing_requirements') {
            throw new MissingSignupRequirementsError(attempt.missingFields, attempt.unverifiedFields);
          }
          setSignupBarangay(null);
          router.replace('/(auth)/sign-in');
          return false;
        }
      }

      throw new Error('No active user or sign-up flow found');
    },
    [clerk, clerkUser, clerkSignUp, setSignUpActive, router, signupBarangay]
  );

  const signOut = useCallback(async () => {
    try {
      logger.info('Signing out user');
      disconnectSocket();
      await clerkSignOut();
      setSignupBarangay(null);
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
      clerkUser,
      signupBarangay,
      setSignupBarangay,
      getToken,
      signIn,
      signInWithGoogle,
      signUp,
      verifyEmail,
      completeSignUp,
      requestPasswordReset,
      verifyPasswordResetCode,
      resetPassword,
      updatePassword,
      signOut,
    }),
    [
      isSignedIn,
      isLoaded,
      user,
      clerkUser,
      signupBarangay,
      getToken,
      signIn,
      signInWithGoogle,
      signUp,
      verifyEmail,
      completeSignUp,
      requestPasswordReset,
      verifyPasswordResetCode,
      resetPassword,
      updatePassword,
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
