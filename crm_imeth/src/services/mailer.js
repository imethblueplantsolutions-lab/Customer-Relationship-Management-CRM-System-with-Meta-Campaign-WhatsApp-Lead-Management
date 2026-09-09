const nodemailer = require('nodemailer');

let transporter = null;

// Initialize Nodemailer transporter if credentials exist in environment
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
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
  const subject = `[Meta CRM] ${title}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #128c7e, #25d366); padding: 16px; text-align: center; border-radius: 8px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">Meta WhatsApp CRM Security</h2>
      </div>
      <div style="padding: 24px 10px;">
        <h3 style="color: #1e293b; margin-top: 0;">${title}</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">
          You are receiving this verification code for your Meta CRM account (<strong>${email}</strong>).
        </p>
        <div style="background-color: #f1f5f9; padding: 18px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #075e54;">${otpCode}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">
          This code is valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.
        </p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #94a3b8;">
        Meta WhatsApp CRM Platform &copy; 2026. All rights reserved.
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Meta CRM Security'}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: htmlContent,
      });
      console.log(`[Mailer] OTP email successfully sent to ${email}`);
    } catch (err) {
      console.error(`[Mailer Error] Failed to send OTP email to ${email}:`, err.message);
    }
  } else {
    // Development console fallback mode
    console.log(`\n======================================================`);
    console.log(`[Mailer DEV MODE] OTP Code Dispatched`);
    console.log(`Target Email: ${email}`);
    console.log(`Subject:      ${subject}`);
    console.log(`OTP Code:     ${otpCode}`);
    console.log(`======================================================\n`);
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
  const subject = `[Meta CRM] Welcome to Meta CRM - Account Provisioned`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #128c7e, #25d366); padding: 16px; text-align: center; border-radius: 8px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">Welcome to Meta WhatsApp CRM</h2>
      </div>
      <div style="padding: 24px 10px;">
        <p style="color: #1e293b; font-size: 15px;">Hello <strong>${name || 'Team Member'}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">
          An administrator has created your account on Meta CRM with the role of <strong>${role}</strong>.
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid #128c7e; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">Login Email: <strong style="color: #1e293b;">${email}</strong></p>
          <p style="margin: 0; font-size: 13px; color: #64748b;">Temporary Password: <strong style="color: #075e54; font-family: monospace; font-size: 16px;">${tempPassword}</strong></p>
        </div>
        <p style="color: #475569; font-size: 13px;">
          Upon your first login, you will be prompted to enter a 6-digit OTP sent to your email and set a new personal password.
        </p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #94a3b8;">
        Meta WhatsApp CRM Platform &copy; 2026. All rights reserved.
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Meta CRM Provisioning'}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: htmlContent,
      });
      console.log(`[Mailer] Welcome email sent to ${email}`);
    } catch (err) {
      console.error(`[Mailer Error] Failed to send welcome email to ${email}:`, err.message);
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`[Mailer DEV MODE] Welcome Email Dispatched`);
    console.log(`Target Email:  ${email}`);
    console.log(`User Name:     ${name}`);
    console.log(`Temp Password: ${tempPassword}`);
    console.log(`Role:          ${role}`);
    console.log(`======================================================\n`);
  }
}

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
};
