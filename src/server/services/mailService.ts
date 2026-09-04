import nodemailer from 'nodemailer';

export interface EmailNotificationResult {
  success: boolean;
  recipient: string;
  subject: string;
  previewUrl?: string;
  isSimulated?: boolean;
  deliveryMethod: 'real_gmail_smtp' | 'custom_smtp' | 'ethereal_preview' | 'error_fallback';
  messageId?: string;
  sentAt: string;
  messageBody: string;
  htmlBody?: string;
  errorDetails?: string;
  accountDetails: {
    name: string;
    email: string;
    username: string;
    role: string;
    isNewAccount: boolean;
  };
}

export interface SmtpConfig {
  user?: string;
  pass?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  service?: string;
  isConfigured: boolean;
}

// In-memory dynamic runtime SMTP configuration
let runtimeSmtpConfig: SmtpConfig = {
  isConfigured: false
};

// Initialize from environment if available
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  runtimeSmtpConfig = {
    service: 'gmail',
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
    isConfigured: true
  };
} else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  runtimeSmtpConfig = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    isConfigured: true
  };
}

export function getRuntimeSmtpConfig(): SmtpConfig {
  return { ...runtimeSmtpConfig, pass: runtimeSmtpConfig.pass ? '••••••••••••••••' : undefined };
}

export function setRuntimeSmtpConfig(config: { user: string; pass: string; service?: string; host?: string; port?: number }): SmtpConfig {
  if (!config.user || !config.pass) {
    throw new Error('User email and App Password are required');
  }
  runtimeSmtpConfig = {
    service: config.service || (config.user.includes('@gmail.com') ? 'gmail' : undefined),
    host: config.host,
    port: config.port || 587,
    secure: config.port === 465,
    user: config.user.trim(),
    pass: config.pass.trim().replace(/\s+/g, ''), // Clean spaces from 16-char app passwords
    isConfigured: true
  };
  console.log(`[MailService] Runtime SMTP configured successfully for user: ${runtimeSmtpConfig.user} (${runtimeSmtpConfig.service || runtimeSmtpConfig.host})`);
  return getRuntimeSmtpConfig();
}

export function clearRuntimeSmtpConfig(): void {
  runtimeSmtpConfig = { isConfigured: false };
}

// Lazy initialized test account for fallback simulation
let testAccount: nodemailer.TestAccount | null = null;

export async function sendAccountNotification(
  user: {
    name: string;
    email: string;
    username: string;
    role: string;
    avatar?: string;
  },
  isNewAccount: boolean = false,
  customCredentials?: { user: string; pass: string }
): Promise<EmailNotificationResult> {
  const sentAt = new Date().toLocaleString();
  const subject = isNewAccount
    ? `🎉 ViewPoint: Successfully Created Account & Logged In via Gmail!`
    : `🔐 ViewPoint: Successfully Logged In to your Account via Gmail!`;

  const messageBody = `Hello ${user.name},

We are confirming that you have successfully logged in to the account and ${isNewAccount ? 'created your account successfully' : 'logged in successfully'}!

Here are your ViewPoint account details:
--------------------------------------------------
• Email / Gmail: ${user.email}
• Username: @${user.username}
• Display Name: ${user.name}
• Account Role: ${user.role.toUpperCase()} (${user.role === 'creator' ? 'Verified Creator Channel' : 'Viewer PRO'})
• Status: Active & Authenticated
• Timestamp: ${sentAt}
--------------------------------------------------

We have verified your credentials. You now have full access to manage your creator studio, upload high-definition videos, stream live content, and engage with the global audience.

If you did not authorize this login, please update your security settings immediately.

Best regards,
The ViewPoint Security & Notification Team`;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0D1117; color: #E6EDF3; padding: 30px; border-radius: 16px; border: 1px solid #30363D;">
      <div style="text-align: center; margin-bottom: 25px; border-bottom: 1px solid #21262D; padding-bottom: 20px;">
        <h1 style="color: #FF4D6D; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">VIEW<span style="color: #818CF8;">POINT</span> STREAMING</h1>
        <p style="color: #8B949E; font-size: 13px; margin-top: 5px;">Official Gmail Security & Account Notification</p>
      </div>

      <div style="background-color: #161B22; padding: 20px; border-radius: 12px; border-left: 4px solid #00C853; margin-bottom: 25px;">
        <h2 style="color: #FFFFFF; font-size: 18px; margin: 0 0 10px 0;">🎉 Successfully Logged In & Account Verified</h2>
        <p style="color: #8B949E; font-size: 14px; line-height: 1.5; margin: 0;">
          Hello <strong style="color: #FFFFFF;">${user.name}</strong>,<br>
          We are confirming that you have successfully logged in to the account and ${isNewAccount ? 'created your account successfully' : 'authenticated successfully'}!
        </p>
      </div>

      <div style="background-color: #010409; padding: 20px; border-radius: 12px; border: 1px solid #30363D; margin-bottom: 25px;">
        <h3 style="color: #818CF8; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0;">📋 Mentioning Your Account Details:</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #8B949E; width: 40%;">Email / Gmail:</td>
            <td style="padding: 8px 0; color: #58A6FF; font-weight: bold;">${user.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8B949E;">Username:</td>
            <td style="padding: 8px 0; color: #FFFFFF; font-weight: bold;">@${user.username}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8B949E;">Display Name:</td>
            <td style="padding: 8px 0; color: #FFFFFF;">${user.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8B949E;">Account Role:</td>
            <td style="padding: 8px 0;"><span style="background-color: rgba(255, 77, 109, 0.2); color: #FF4D6D; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${user.role.toUpperCase()}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8B949E;">Status:</td>
            <td style="padding: 8px 0; color: #00C853; font-weight: bold;">✓ Active Verified</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8B949E;">Timestamp:</td>
            <td style="padding: 8px 0; color: #8B949E; font-size: 12px;">${sentAt}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 25px;">
        <a href="https://viewpoint.app" style="background: linear-gradient(135deg, #FF4D6D 0%, #818CF8 100%); color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 24px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 77, 109, 0.3);">Access Creator Studio</a>
      </div>

      <div style="border-top: 1px solid #21262D; padding-top: 15px; text-align: center; font-size: 11px; color: #484F58;">
        <p style="margin: 0;">You received this automated message because an authentication event occurred for ${user.email}.</p>
        <p style="margin: 5px 0 0 0;">&copy; 2026 ViewPoint Ecosystem &bull; Security & Account Protection</p>
      </div>
    </div>
  `;

  try {
    let transporter: nodemailer.Transporter;
    let isSimulated = false;
    let previewUrl: string | undefined = undefined;
    let deliveryMethod: 'real_gmail_smtp' | 'custom_smtp' | 'ethereal_preview' | 'error_fallback' = 'ethereal_preview';

    // 1. Determine which credentials to use
    const activeUser = customCredentials?.user || runtimeSmtpConfig.user;
    const activePass = customCredentials?.pass || runtimeSmtpConfig.pass;
    const activeService = runtimeSmtpConfig.service;
    const activeHost = runtimeSmtpConfig.host;

    if (activeUser && activePass) {
      const isGmail = activeUser.includes('@gmail.com') || activeService === 'gmail';
      deliveryMethod = isGmail ? 'real_gmail_smtp' : 'custom_smtp';
      
      if (isGmail) {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: activeUser.trim(),
            pass: activePass.trim().replace(/\s+/g, ''),
          },
        });
      } else {
        transporter = nodemailer.createTransport({
          host: activeHost || 'smtp.gmail.com',
          port: runtimeSmtpConfig.port || 587,
          secure: runtimeSmtpConfig.secure || false,
          auth: {
            user: activeUser.trim(),
            pass: activePass.trim().replace(/\s+/g, ''),
          },
        });
      }
    } else {
      // 2. Ethereal automated SMTP simulation for zero-config verification
      isSimulated = true;
      deliveryMethod = 'ethereal_preview';
      if (!testAccount) {
        testAccount = await Promise.race([
          nodemailer.createTestAccount(),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Ethereal network timeout')), 10000))
        ]).catch(() => null);
      }
      if (testAccount) {
        transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }
    }

    let info: any = { messageId: `sim-${Date.now()}` };
    let errorDetails: string | undefined = undefined;

    if (transporter!) {
      try {
        info = await Promise.race([
          transporter.sendMail({
            from: activeUser ? `"${user.name} via ViewPoint" <${activeUser}>` : '"ViewPoint Security & Notifications" <noreply@viewpoint.app>',
            to: user.email,
            subject,
            text: messageBody,
            html: htmlBody,
          }),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('SMTP dispatch timeout')), 15000))
        ]);
      } catch (err: any) {
        console.warn(`[MailService] SMTP dispatch failed (${err.message}). Falling back to simulated delivery.`);
        isSimulated = true;
        deliveryMethod = 'ethereal_preview';
        errorDetails = `SMTP Authentication Warning: ${err.message}. Showing in-app HTML preview notification.`;
        
        try {
          if (!testAccount) {
            testAccount = await Promise.race([
              nodemailer.createTestAccount(),
              new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Ethereal network timeout')), 5000))
            ]).catch(() => null);
          }
          if (testAccount) {
            const fallbackTransporter = nodemailer.createTransport({
              host: testAccount.smtp.host,
              port: testAccount.smtp.port,
              secure: testAccount.smtp.secure,
              auth: { user: testAccount.user, pass: testAccount.pass },
            });
            info = await fallbackTransporter.sendMail({
              from: '"ViewPoint Security & Notifications" <noreply@viewpoint.app>',
              to: user.email,
              subject,
              text: messageBody,
              html: htmlBody,
            });
          } else {
            info = { messageId: `sim-fallback-${Date.now()}` };
          }
        } catch {
          info = { messageId: `sim-fallback-${Date.now()}` };
        }
      }
    }

    if (isSimulated && info && info.messageId && !info.messageId.startsWith('sim-')) {
      const url = nodemailer.getTestMessageUrl(info);
      if (typeof url === 'string') {
        previewUrl = url;
      }
    }

    console.log(`[MailService] (${deliveryMethod}) Email processed for Gmail (${user.email}). Message ID: ${info?.messageId}`);
    if (previewUrl) {
      console.log(`[MailService] Ethereal Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      recipient: user.email,
      subject,
      previewUrl: previewUrl || (isSimulated ? 'https://ethereal.email' : undefined),
      isSimulated,
      deliveryMethod,
      errorDetails,
      messageId: info?.messageId,
      sentAt,
      messageBody,
      htmlBody,
      accountDetails: {
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isNewAccount,
      },
    };
  } catch (error: any) {
    console.error('[MailService] Failed to send email notification:', error);
    return {
      success: false,
      recipient: user.email,
      subject,
      previewUrl: undefined,
      isSimulated: false,
      deliveryMethod: 'error_fallback',
      errorDetails: error.message || 'Failed to connect to SMTP server. Please check your Gmail App Password and 2FA.',
      messageId: `sim-error-${Date.now()}`,
      sentAt,
      messageBody,
      htmlBody,
      accountDetails: {
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isNewAccount,
      },
    };
  }
}
