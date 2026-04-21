import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Alternative: Use environment-based configuration
const getTransporter = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Send verification email
 */
export async function sendVerificationEmail(to: string, token: string, fullName: string) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://new-project-theta-ashy.vercel.app';
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Space Platform" <${process.env.EMAIL_USER || 'noreply@spaceplatform.com'}>`,
    to,
    subject: 'Verify Your Email - Space Platform',
    html: `
      <!DOCTYPE html>
      <html dir="ltr">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 24px; font-weight: bold; color: #C5A572; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #C5A572; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Space Platform</div>
          </div>
          <div class="content">
            <h2>Welcome, ${fullName}!</h2>
            <p>Thank you for registering with Space Platform. Please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${verifyUrl}" class="button">Verify Email</a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #C5A572;">${verifyUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Space Platform. All rights reserved.</p>
            <p>Any space. Anywhere. Any purpose.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const transport = getTransporter();
    await transport.sendMail(mailOptions);
    console.log(`Verification email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Don't throw - email failure shouldn't block registration
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(to: string, token: string, fullName: string) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://new-project-theta-ashy.vercel.app';
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Space Platform" <${process.env.EMAIL_USER || 'noreply@spaceplatform.com'}>`,
    to,
    subject: 'Reset Your Password - Space Platform',
    html: `
      <!DOCTYPE html>
      <html dir="ltr">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 24px; font-weight: bold; color: #C5A572; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #C5A572; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Space Platform</div>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${fullName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #C5A572;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ This link will expire in 1 hour.</strong>
            </div>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Space Platform. All rights reserved.</p>
            <p>Any space. Anywhere. Any purpose.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const transport = getTransporter();
    await transport.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}
