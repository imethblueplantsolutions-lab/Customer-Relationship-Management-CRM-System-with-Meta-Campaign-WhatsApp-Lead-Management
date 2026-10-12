const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter for OTP Requests:
 * Restricts sensitive security OTP generation to a maximum of 5 requests per hour per IP.
 */
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many OTP requests from this IP. Please wait 1 hour before trying again.',
  },
});

/**
 * Rate Limiter for Data Exports:
 * Restricts large CSV/Excel lead exports to a maximum of 10 requests per hour per IP.
 */
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Export request limit reached. Please wait 1 hour before exporting again.',
  },
});

module.exports = {
  otpLimiter,
  exportLimiter,
};
