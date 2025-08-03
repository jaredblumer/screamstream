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
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const sender = {
      email: 'noreply@screamstream.app',
      name: 'Scream Stream',
    };

    await client.send({
      from: sender,
      to: [{ email: params.to }],
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

export function generatePasswordResetEmail(resetUrl: string): { text: string; html: string } {
  const text = `
Password Reset Request

You've requested to reset your password for Scream Stream.

Click the link below to reset your password:
${resetUrl}

If you didn't request this password reset, please ignore this email.

This link will expire in 1 hour for security purposes.

Best regards,
The Scream Stream Team
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Password Reset - Scream Stream</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #0a0a0a;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(135deg, #1a0f1a 0%, #2d1b2d 100%);
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #dc2626;
      margin-bottom: 10px;
    }
    .content {
      color: #e5e5e5;
      margin-bottom: 30px;
    }
    .reset-button {
      display: inline-block;
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      text-decoration: none;
      padding: 15px 30px;
      border-radius: 8px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
    .reset-button:hover {
      background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #374151;
      color: #9ca3af;
      font-size: 14px;
    }
    .warning {
      background: rgba(220, 38, 38, 0.1);
      border: 1px solid #dc2626;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
      color: #fca5a5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎬 Scream Stream</div>
      <h1 style="color: #dc2626; margin: 0;">Password Reset Request</h1>
    </div>
    
    <div class="content">
      <p>You've requested to reset your password for your Scream Stream account.</p>
      
      <p>Click the button below to reset your password:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="reset-button">Reset Your Password</a>
      </div>
      
      <div class="warning">
        <strong>Security Notice:</strong> This link will expire in 1 hour for your protection. If you didn't request this password reset, please ignore this email.
      </div>
      
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
    </div>
    
    <div class="footer">
      <p>Best regards,<br>The Scream Stream Team</p>
      <p><em>This is an automated email. Please do not reply to this message.</em></p>
    </div>
  </div>
</body>
</html>
  `;

  return { text, html };
}
