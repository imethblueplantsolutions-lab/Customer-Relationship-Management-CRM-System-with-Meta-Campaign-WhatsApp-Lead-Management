const crypto = require('crypto');

/**
 * Middleware to verify Meta WhatsApp Webhook HMAC-SHA256 signatures.
 * Meta transmits the payload signature in the X-Hub-Signature-256 header
 * using the application's META_APP_SECRET as the HMAC secret key.
 */
function verifyMetaWebhook(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];

  if (!signature) {
    console.warn('[Webhook Security] Missing X-Hub-Signature-256 header.');
    return res.status(403).json({ error: 'Missing webhook signature header' });
  }

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error('[Webhook Security] META_APP_SECRET is not configured on the server.');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!req.rawBody) {
    console.warn('[Webhook Security] Raw request body buffer is missing for HMAC verification.');
    return res.status(403).json({ error: 'Unable to verify webhook signature without raw body' });
  }

  try {
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(req.rawBody);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    // crypto.timingSafeEqual throws an error if buffer lengths differ
    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      console.warn('[Webhook Security] Invalid X-Hub-Signature-256 signature.');
      return res.status(403).json({ error: 'Invalid webhook signature' });
    }

    next();
  } catch (error) {
    console.error('[Webhook Security] Verification error:', error.message);
    return res.status(403).json({ error: 'Webhook signature verification failed' });
  }
}

module.exports = verifyMetaWebhook;
module.exports.verifyMetaWebhook = verifyMetaWebhook;
