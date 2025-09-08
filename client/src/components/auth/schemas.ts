import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  recaptchaToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  recaptchaToken: z.string().optional(),
});

export const securePassword = z
  .string()
  .min(12, 'Password must be at least 12 characters long')
  .regex(/\d/, 'Password must include at least one number')
  .regex(
    /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;]/,
    'Password must include at least one special character'
  );

export const resetPasswordSchema = z
  .object({
    newPassword: securePassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters long')
  .max(20, 'Username must be at most 20 characters long')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Only letters, numbers, underscores, periods, and dashes are allowed')
  .regex(/^[a-zA-Z0-9]/, 'Username must start with a letter or number')
  .regex(/[a-zA-Z0-9]$/, 'Username must end with a letter or number');

export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type SecurePasswordData = z.infer<typeof securePassword>;
export type UsernameData = z.infer<typeof usernameSchema>;
