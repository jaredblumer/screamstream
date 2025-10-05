import { MailtrapClient } from 'mailtrap';

if (!process.env.MAILTRAP_TOKEN) {
  throw new Error('MAILTRAP_TOKEN environment variable must be set');
}

const client = new MailtrapClient({
  token: process.env.MAILTRAP_TOKEN,
});

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const sender = {
      email: 'help@frightbyte.net',
      name: 'FrightByte',
    };

    await client.send({
      from: sender,
      to: [{ email: params.to }],
      subject: params.subject,
      text: params.text,
    });

    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

export function generatePasswordResetEmail(resetUrl: string): { text: string } {
  const text = `
You've requested to reset your password for FrightByte.

Click the link below to reset your password:
${resetUrl}

If you didn't request this password reset, please ignore this email.

This link will expire in 1 hour for security purposes.

Best regards,
The FrightByte Team
  `;

  return { text };
}
