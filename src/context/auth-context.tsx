import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuth, useUser, useOAuth } from '@clerk/expo';
import { useSignIn, useSignUp } from '@clerk/expo/legacy';
import { useRouter } from 'expo-router';
import {
  User,
  SignUpInput,
  signInSchema,
  signUpSchema,
  verifyCodeSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
} from '@/types';
import { setAuthTokenGetter } from '@/lib/auth-token';
import { logger } from '@/lib/logger';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  user: User | null;
  isOAuthLoading: boolean;
  getToken: () => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpInput) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerificationCode: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (code: string, newPassword: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSignedIn, isLoaded: authLoaded, signOut: clerkSignOut, getToken } = useAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { signIn: clerkSignIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp: clerkSignUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  const isLoaded = authLoaded && userLoaded && signInLoaded && signUpLoaded;

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
        logger.info('User signed in', 'AuthContext');
        await setSignInActive({ session: attempt.createdSessionId });
        router.replace('/(app)/(tabs)');
      } else {
        logger.warn('Sign in incomplete', 'AuthContext', attempt);
        throw new Error('Additional verification required.');
      }
    },
    [clerkSignIn, setSignInActive, router]
  );

  const signUp = useCallback(
    async (params: SignUpInput) => {
      if (!clerkSignUp) throw new Error('Sign-up service unavailable');

      // Zod validation
      const validated = signUpSchema.parse(params);

      const nameParts = validated.fullName.split(' ');
      const firstName = nameParts[0] || validated.fullName;
      const lastName = nameParts.slice(1).join(' ') || '';

      await clerkSignUp.create({
        firstName,
        lastName,
        emailAddress: validated.email,
        password: validated.password,
        unsafeMetadata: {
          fullName: validated.fullName,
          contactNumber: validated.contactNumber?.trim() || undefined,
          location: validated.location?.trim() || undefined,
        },
      });

      await clerkSignUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      logger.info('Sign-up verification code sent', 'AuthContext');
    },
    [clerkSignUp]
  );

  const verifyEmail = useCallback(
    async (code: string) => {
      if (!clerkSignUp) throw new Error('Sign-up service unavailable');

      // Zod validation
      const validated = verifyCodeSchema.parse({ code });

      const attempt = await clerkSignUp.attemptEmailAddressVerification({
        code: validated.code,
      });

      if (attempt.status === 'complete') {
        logger.info('Email verified successfully', 'AuthContext');
        await setSignUpActive({ session: attempt.createdSessionId });
        router.replace('/(app)/(tabs)');
      } else {
        logger.warn('Email verification incomplete', 'AuthContext', attempt);
        throw new Error('Verification incomplete. Please try again.');
      }
    },
    [clerkSignUp, setSignUpActive, router]
  );

  const resendVerificationCode = useCallback(async () => {
    if (!clerkSignUp) throw new Error('Sign-up service unavailable');
    await clerkSignUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    logger.info('Verification code resent', 'AuthContext');
  }, [clerkSignUp]);

  const requestPasswordReset = useCallback(
    async (email: string) => {
      if (!clerkSignIn) throw new Error('Sign-in service unavailable');

      // Zod validation
      const validated = resetPasswordRequestSchema.parse({ email });

      await clerkSignIn.create({
        strategy: 'reset_password_email_code',
        identifier: validated.email,
      });
      logger.info('Password reset email sent', 'AuthContext');
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
        logger.info('Password reset complete', 'AuthContext');
        await setSignInActive({ session: result.createdSessionId });
        router.replace('/(app)/(tabs)');
      } else {
        logger.warn('Password reset incomplete', 'AuthContext', result);
        throw new Error('Password reset incomplete. Please try again.');
      }
    },
    [clerkSignIn, setSignInActive, router]
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      setIsOAuthLoading(true);
      const redirectUrl = Linking.createURL('/(app)/(tabs)');
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        logger.info('Google OAuth successful', 'AuthContext');
        await setActive({ session: createdSessionId });
        router.replace('/(app)/(tabs)');
      }
    } catch (err: any) {
      logger.error('Google OAuth error', err, 'AuthContext');
      throw err;
    } finally {
      setIsOAuthLoading(false);
    }
  }, [startOAuthFlow, router]);

  const signOut = useCallback(async () => {
    try {
      logger.info('Signing out user', 'AuthContext');
      await clerkSignOut();
      router.replace('/(auth)/sign-in');
    } catch (err: any) {
      logger.error('Sign out error', err, 'AuthContext');
      throw err;
    }
  }, [clerkSignOut, router]);

  const value = useMemo<AuthContextType>(
    () => ({
      isSignedIn: !!isSignedIn,
      isLoaded,
      user,
      isOAuthLoading,
      getToken,
      signIn,
      signUp,
      verifyEmail,
      resendVerificationCode,
      requestPasswordReset,
      resetPassword,
      signInWithGoogle,
      signOut,
    }),
    [
      isSignedIn,
      isLoaded,
      user,
      isOAuthLoading,
      getToken,
      signIn,
      signUp,
      verifyEmail,
      resendVerificationCode,
      requestPasswordReset,
      resetPassword,
      signInWithGoogle,
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
