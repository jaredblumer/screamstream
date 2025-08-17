import type { Express } from 'express';
import { storage } from '../../storage';
import { verifyRecaptcha } from '../../auth';
import { sendEmail, generatePasswordResetEmail } from '../../email';
import { randomBytes } from 'crypto';
import { hashPassword } from '../utils/hash';
import { ResetPasswordBody } from '@server/validation/auth';
import { validateBody } from '@server/utils/validate';

export function registerPasswordRoutes(app: Express) {
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email, recaptchaToken } = req.body;
      if (!email) return res.status(400).json({ message: 'Email is required' });

      if (process.env.RECAPTCHA_SECRET_KEY && process.env.NODE_ENV !== 'development') {
        if (!recaptchaToken) {
          return res.status(400).json({
            message: 'reCAPTCHA verification is required. Please complete the challenge.',
          });
        }
        const recaptchaValid = await verifyRecaptcha(recaptchaToken);
        if (!recaptchaValid) {
          return res
            .status(400)
            .json({ message: 'reCAPTCHA verification failed. Please try again.' });
        }
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({
          message: 'If an account with that email exists, a password reset link has been sent.',
        });
      }

      const resetToken = randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      await storage.setPasswordResetToken(user.id, resetToken, resetTokenExpiry);

      const resetUrl = `${req.protocol}://${req.get('host')}/auth?reset=${resetToken}`;
      const emailContent = generatePasswordResetEmail(resetUrl);

      const emailSent = await sendEmail({
        to: email,
        subject: 'Password Reset - Scream Stream',
        text: emailContent.text,
      });

      if (emailSent) {
        res.json({
          message: 'If an account with that email exists, a password reset link has been sent.',
        });
      } else {
        res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/reset-password', validateBody(ResetPasswordBody), async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      const user = await storage.getUserByResetToken(token);
      if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });
      await storage.clearPasswordResetToken(user.id);

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}
