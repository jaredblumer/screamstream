import { z } from 'zod';

export const securePassword = z
  .string()
  .min(13, 'Password must be at least 13 characters long')
  .regex(/\d/, 'Password must include at least one number')
  // ASCII “specials” set; adjust if you want broader allowance
  .regex(
    /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;]/,
    'Password must include at least one special character'
  );

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters long')
  .max(20, 'Username must be at most 20 characters long')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Only letters, numbers, underscores, periods, and dashes are allowed')
  .regex(/^[a-zA-Z0-9]/, 'Username must start with a letter or number')
  .regex(/[a-zA-Z0-9]$/, 'Username must end with a letter or number');

export const RegisterBody = z.object({
  username: usernameSchema,
  email: z.string().email('Valid email required'),
  password: securePassword,
  recaptchaToken: z.string().optional(),
});

export const ResetPasswordBody = z.object({
  token: z.string().min(1, 'Reset token required'),
  newPassword: securePassword,
});
