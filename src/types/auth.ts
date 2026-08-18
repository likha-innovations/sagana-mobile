import { z } from 'zod';

/**
 * Prisma User Schema Definition
 * Mirrors sagana-backend Prisma model User
 */
export const userSchema = z.object({
  id: z.string(), // Clerk User ID (user_2bX...)
  fullName: z.string().nullable(),
  email: z.string().email('Invalid email address'),
  contactNumber: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export type User = z.infer<typeof userSchema>;

/**
 * Update Profile DTO Schema
 * Matches backend UpdateProfileDto
 */
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .optional(),
  contactNumber: z
    .string()
    .trim()
    .min(5, 'Contact number must be at least 5 characters')
    .optional(),
  location: z
    .string()
    .trim()
    .min(2, 'Location must be at least 2 characters')
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Sign In Form Schema
 */
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Sign Up Form Schema
 */
export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  contactNumber: z
    .string()
    .trim()
    .optional(),
  location: z
    .string()
    .trim()
    .optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

/**
 * Email Verification Code Schema
 */
export const verifyCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, 'Verification code must be exactly 6 digits'),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

/**
 * Password Reset Request Schema
 */
export const resetPasswordRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;

/**
 * Password Reset Confirm Schema
 */
export const resetPasswordConfirmSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, 'Reset code must be exactly 6 digits'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmSchema>;
