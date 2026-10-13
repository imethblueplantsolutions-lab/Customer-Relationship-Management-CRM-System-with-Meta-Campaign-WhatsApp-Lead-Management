const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const nodemailer = require('nodemailer');
const axios = require('axios');

let transporter = null;

// Initialize Nodemailer transporter if credentials exist in environment
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const isSecure = process.env.EMAIL_SECURE === 'true' || port === 465;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: port,
    secure: isSecure,
    family: 4, // Explicitly force IPv4 to prevent ENETUNREACH in cloud environments without IPv6 routing
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Send an OTP code email to a target recipient
 * @param {string} email - Destination email address
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} title - Context/Subject title (e.g., "First-Time Login Verification")
 */
async function sendOtpEmail(email, otpCode, title = 'Security Verification Code') {
  const subject = `[MyCRM] ${title}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0F4C75, #3282B8); padding: 16px; text-align: center; border-radius: 8px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">MyCRM Security</h2>
      </div>
      <div style="padding: 24px 10px;">
        <h3 style="color: #1e293b; margin-top: 0;">${title}</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">
          You are receiving this verification code for your MyCRM account (<strong>${email}</strong>).
        </p>
        <div style="background-color: #f1f5f9; padding: 18px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0F4C75;">${otpCode}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">
          This code is valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.
        </p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #94a3b8;">
        MyCRM Platform &copy; 2026. All rights reserved.
      </div>
    </div>
  `;

  // 1. Prioritize Resend HTTPS API if configured (bypasses all cloud SMTP port restrictions)
  if (process.env.RESEND_API_KEY) {
    try {
      const resendResponse = await axios.post('https://api.resend.com/emails', {
        from: `${process.env.EMAIL_FROM_NAME || 'MyCRM Security'} <${process.env.RESEND_FROM || 'onboarding@resend.dev'}>`,
        to: [email],
        subject,
        html: htmlContent,
      }, {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000, // 8 second timeout to prevent Railway worker thread hanging
      });
      console.log(`[Mailer - Resend API] OTP email successfully sent to ${email} (id: ${resendResponse.data?.id})`);
      return;
    } catch (err) {
      const status = err.response?.status;
      const resendError = err.response?.data;
      let friendlyError = err.message;

      if (status === 401) {
        friendlyError = 'RESEND_API_KEY is invalid or expired. Check Railway environment variables.';
      } else if (status === 403) {
        friendlyError = `Resend rejected recipient "${email}". When using onboarding@resend.dev, you may only send to your Resend-registered email. Verify a custom domain at resend.com/domains.`;
      } else if (status === 422) {
        friendlyError = `Resend validation error: ${resendError?.message}. Check RESEND_FROM sender address.`;
      } else if (status === 429) {
        friendlyError = 'Resend rate limit exceeded. Reduce OTP dispatch frequency.';
      } else if (resendError?.message) {
        friendlyError = resendError.message;
      }

      console.error(`[Mailer Error - Resend] HTTP ${status || 'N/A'} - ${friendlyError}`);
      throw new Error(`Email delivery failed via Resend API: ${friendlyError}`);
    }
  }

  // 2. Fall back to Nodemailer SMTP (IPv4 enforced)
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'MyCRM Security'}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: htmlContent,
      });
      console.log(`[Mailer] OTP email successfully sent to ${email}`);
    } catch (err) {
      console.error(`[Mailer Error] Failed to send OTP email to ${email}:`, err.message);
      throw new Error(`Email delivery failed: ${err.message}`);
    }
  } else {
    // Development console fallback mode
    console.log(`\n======================================================`);
    console.log(`[Mailer DEV MODE] OTP Code Dispatched`);
    console.log(`Target Email: ${email}`);
    console.log(`Subject:      ${subject}`);
    console.log(`OTP Code:     ${otpCode}`);
    console.log(`======================================================\n`);
    if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
      throw new Error('SMTP email credentials are not configured on this server (missing EMAIL_USER or EMAIL_PASS).');
    }
  }
}

/**
 * Send Welcome Email with auto-generated temporary password to a newly provisioned user
 * @param {string} email 
 * @param {string} name 
 * @param {string} tempPassword 
 * @param {string} role 
 */
async function sendWelcomeEmail(email, name, tempPassword, role) {
  const subject = `[MyCRM] Welcome to MyCRM - Account Provisioned`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0F4C75, #3282B8); padding: 16px; text-align: center; border-radius: 8px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">Welcome to MyCRM</h2>
      </div>
      <div style="padding: 24px 10px;">
        <p style="color: #1e293b; font-size: 15px;">Hello <strong>${name || 'Team Member'}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">
          An administrator has created your account on MyCRM with the role of <strong>${role}</strong>.
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid #3282B8; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">Login Email: <strong style="color: #1e293b;">${email}</strong></p>
          <p style="margin: 0; font-size: 13px; color: #64748b;">Temporary Password: <strong style="color: #0F4C75; font-family: monospace; font-size: 16px;">${tempPassword}</strong></p>
        </div>
        <p style="color: #475569; font-size: 13px;">
          Upon your first login, you will be prompted to enter a 6-digit OTP sent to your email and set a new personal password.
        </p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #94a3b8;">
        MyCRM Platform &copy; 2026. All rights reserved.
      </div>
    </div>
  `;

  // 1. Prioritize Resend HTTPS API if configured
  if (process.env.RESEND_API_KEY) {
    try {
      await axios.post('https://api.resend.com/emails', {
        from: `${process.env.EMAIL_FROM_NAME || 'MyCRM Provisioning'} <${process.env.RESEND_FROM || 'onboarding@resend.dev'}>`,
        to: [email],
        subject,
        html: htmlContent,
      }, {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });
      console.log(`[Mailer - Resend API] Welcome email successfully sent to ${email}`);
      return;
    } catch (err) {
      console.error(`[Mailer Error - Resend] Failed to send welcome email to ${email}:`, err.response?.data || err.message);
      throw new Error(`Welcome email delivery failed via Resend API: ${err.response?.data?.message || err.message}`);
    }
  }

  // 2. Fall back to Nodemailer SMTP (IPv4 enforced)
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'MyCRM Provisioning'}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: htmlContent,
      });
      console.log(`[Mailer] Welcome email sent to ${email}`);
    } catch (err) {
      console.error(`[Mailer Error] Failed to send welcome email to ${email}:`, err.message);
      throw new Error(`Welcome email delivery failed: ${err.message}`);
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`[Mailer DEV MODE] Welcome Email Dispatched`);
    console.log(`Target Email:  ${email}`);
    console.log(`User Name:     ${name}`);
    console.log(`Temp Password: ${tempPassword}`);
    console.log(`Role:          ${role}`);
    console.log(`======================================================\n`);
    if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
      throw new Error('SMTP email credentials are not configured on this server (missing EMAIL_USER or EMAIL_PASS).');
    }
  }
}

const COMPANY_CONFIG = require('../config/company');
const crypto = require('crypto');

/**
 * Generates an HMAC unsubscribe verification token for an email address
 * @param {string} email
 * @returns {string}
 */
function generateUnsubscribeToken(email) {
  const secret = process.env.JWT_SECRET || 'crm_unsubscribe_token_secret';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase().trim()).digest('hex');
}

/**
 * Validates an HMAC unsubscribe token
 * @param {string} email
 * @param {string} token
 * @returns {boolean}
 */
function verifyUnsubscribeToken(email, token) {
  if (!email || !token) return false;
  const expected = generateUnsubscribeToken(email);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

/**
 * Dispatches a CAN-SPAM compliant marketing or promotional email.
 * Guarantees:
 * 1. Non-deceptive clear sender
 * 2. Unsubscribe suppression check before sending
 * 3. Physical postal address in footer
 * 4. Working one-click unsubscribe link
 * 
 * @param {string} email - Destination email
 * @param {string} subject - Email subject line
 * @param {string} bodyHtml - Main HTML email body
 * @param {object} [options] - Optional overrides (senderName, recipientName)
 */
async function sendMarketingEmail(email, subject, bodyHtml, options = {}) {
  const cleanEmail = email.toLowerCase().trim();
  const prisma = require('../config/db');

  // 1. CAN-SPAM: Pre-flight Suppression List & Opt-Out Check
  const [unsubscribedLead, unsubscribedUser] = await Promise.all([
    prisma.lead.findFirst({
      where: { email: cleanEmail, isSubscribed: false },
      select: { id: true, unsubscribedAt: true },
    }),
    prisma.user.findFirst({
      where: { email: cleanEmail, isSubscribed: false },
      select: { id: true, unsubscribedAt: true },
    }),
  ]);

  if (unsubscribedLead || unsubscribedUser) {
    const errorMsg = `[CAN-SPAM Suppression] Recipient ${cleanEmail} has previously opted out of marketing communications. Dispatch aborted.`;
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  // 2. Generate secure unsubscribe URL
  const token = generateUnsubscribeToken(cleanEmail);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const unsubscribeUrl = `${frontendUrl}/unsubscribe?email=${encodeURIComponent(cleanEmail)}&token=${token}`;

  const postalAddress = COMPANY_CONFIG.postalAddress;
  const senderName = options.senderName || process.env.EMAIL_FROM_NAME || COMPANY_CONFIG.name;
  const fromEmail = process.env.EMAIL_USER || 'marketing@mycrm.example.com';

  const fullHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
        <h2 style="margin: 0; color: #0F4C75; font-size: 20px;">${COMPANY_CONFIG.name}</h2>
      </div>
      <div style="padding: 24px 0; line-height: 1.6; font-size: 14px; color: #334155;">
        ${bodyHtml}
      </div>
      <!-- CAN-SPAM Mandatory Compliance Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #64748b; line-height: 1.5; background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 24px;">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #475569;">
          Physical Postal Address:
        </p>
        <p style="margin: 0 0 12px 0;">
          ${postalAddress}
        </p>
        <p style="margin: 0 0 12px 0;">
          You are receiving this commercial message because your email (${cleanEmail}) is registered with our services or opted into enterprise updates.
        </p>
        <p style="margin: 0;">
          If you no longer wish to receive marketing communications, you may 
          <a href="${unsubscribeUrl}" style="color: #0284c7; text-decoration: underline; font-weight: 600;" target="_blank">
            unsubscribe here
          </a> at any time. Opt-out requests are honored immediately.
        </p>
      </div>
    </div>
  `;

  // Send via Resend or Nodemailer SMTP
  if (process.env.RESEND_API_KEY) {
    try {
      await axios.post('https://api.resend.com/emails', {
        from: `${senderName} <${process.env.RESEND_FROM || 'onboarding@resend.dev'}>`,
        to: [cleanEmail],
        subject,
        html: fullHtml,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
        },
      }, {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(`[Mailer - Resend] Marketing email dispatched to ${cleanEmail}`);
      return;
    } catch (err) {
      console.error('[Mailer - Resend] Marketing email dispatch failed:', err.response?.data || err.message);
      throw new Error(`Marketing email delivery failed via Resend: ${err.message}`);
    }
  }

  if (transporter) {
    await transporter.sendMail({
      from: `"${senderName}" <${fromEmail}>`,
      to: cleanEmail,
      subject,
      html: fullHtml,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
      },
    });
    console.log(`[Mailer - SMTP] Marketing email sent to ${cleanEmail}`);
  } else {
    console.log(`[Mailer DEV MODE] Marketing Email Dispatched to ${cleanEmail} with CAN-SPAM Footer`);
  }
}

/**
 * Sends a California ARL (Automatic Renewal Law) compliant subscription acknowledgment email.
 * Satisfies Cal. Bus. & Prof. Code § 17602:
 * 1. Details the automatic renewal terms, price, and billing frequency
 * 2. Provides the cancellation policy and straightforward online cancellation instructions
 * 
 * @param {string} email 
 * @param {string} name 
 * @param {object} planDetails - { planName, price, billingInterval, nextBillingDate }
 */
async function sendSubscriptionConfirmationEmail(email, name, planDetails = {}) {
  const cleanEmail = email.toLowerCase().trim();
  const subject = `[MyCRM] Your Subscription Confirmation & Automatic Renewal Terms`;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const cancelUrl = `${frontendUrl}/settings?tab=billing`;

  const planName = planDetails.planName || 'Enterprise Growth Plan';
  const price = planDetails.price !== undefined ? `$${planDetails.price}` : '$29.00';
  const billingInterval = planDetails.billingInterval || 'monthly';
  const nextBillingDate = planDetails.nextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0F4C75, #3282B8); padding: 18px; text-align: center; border-radius: 8px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">Subscription Confirmation & Terms</h2>
      </div>
      <div style="padding: 24px 8px; color: #334155; line-height: 1.6;">
        <p style="font-size: 15px; margin-top: 0;">Hello <strong>${name || 'Customer'}</strong>,</p>
        <p style="font-size: 14px;">
          Thank you for subscribing to <strong>${planName}</strong> on MyCRM. Below are your required terms and automatic renewal disclosures.
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid #0F4C75; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Plan:</strong> ${planName}</p>
          <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Recurring Charge:</strong> ${price} / ${billingInterval}</p>
          <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Billing Frequency:</strong> Charged automatically every ${billingInterval} on an ongoing basis</p>
          <p style="margin: 0; font-size: 13px;"><strong>Next Scheduled Renewal:</strong> ${nextBillingDate}</p>
        </div>
        <h4 style="color: #0F4C75; margin-bottom: 8px;">Automatic Renewal & Cancellation Policy (California ARL Compliance)</h4>
        <p style="font-size: 13px; color: #475569;">
          Your subscription will automatically renew at the end of each ${billingInterval} billing cycle at the rate of ${price} until you cancel. 
          You may cancel your subscription at any time without fees or penalties.
        </p>
        <p style="font-size: 13px; color: #475569;">
          <strong>How to cancel online:</strong> You can cancel your subscription immediately online with zero hassle by logging into your account and navigating to 
          <a href="${cancelUrl}" style="color: #0284c7; font-weight: bold;">Settings &gt; Billing &gt; Cancel Subscription</a>.
        </p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
        ${COMPANY_CONFIG.name} &bull; ${COMPANY_CONFIG.postalAddress} &bull; &copy; 2026 All Rights Reserved
      </div>
    </div>
  `;

  // Dispatch via Resend or Nodemailer
  if (process.env.RESEND_API_KEY) {
    try {
      await axios.post('https://api.resend.com/emails', {
        from: `${process.env.EMAIL_FROM_NAME || 'MyCRM Billing'} <${process.env.RESEND_FROM || 'onboarding@resend.dev'}>`,
        to: [cleanEmail],
        subject,
        html: htmlContent,
      }, {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      return;
    } catch (err) {
      console.error('[Mailer - Resend] Subscription confirmation email failed:', err.message);
    }
  }

  if (transporter) {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'MyCRM Billing'}" <${process.env.EMAIL_USER}>`,
      to: cleanEmail,
      subject,
      html: htmlContent,
    });
  } else {
    console.log(`[Mailer DEV MODE] Subscription confirmation sent to ${cleanEmail}`);
  }
}

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendMarketingEmail,
  sendSubscriptionConfirmationEmail,
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
};

