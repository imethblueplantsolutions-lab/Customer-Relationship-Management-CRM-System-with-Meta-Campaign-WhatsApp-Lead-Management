const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

// Maximum allowed file size: 25MB (Vector 12 DoS mitigation)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Strict MIME-type allowlist (Vector 12 Malicious file execution mitigation)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp4',
  'video/mp4',
]);

const MIME_EXTENSION_MAP = {
  // Images
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  // Audio
  'audio/ogg': '.ogg',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  // Video
  'video/mp4': '.mp4',
  // Documents & Application
  'application/pdf': '.pdf',
};

/**
 * Resolves appropriate file extension from a MIME type string.
 *
 * @param {string} mimeType
 * @returns {string} File extension including leading dot (e.g., '.jpg' or '.bin')
 */
function getExtensionFromMime(mimeType) {
  if (!mimeType) return '.bin';
  const cleanMime = mimeType.split(';')[0].trim().toLowerCase();
  return MIME_EXTENSION_MAP[cleanMime] || '.bin';
}

/**
 * Downloads a WhatsApp media file from Meta Graph API and stores it in the local /uploads directory.
 * Enforces strict security controls:
 * - Content-Length validation against 25MB threshold
 * - Content-Type validation against strict MIME allowlist
 * - Stream abort on size limit breach
 * - Safe disk cleanup using fs.promises.unlink upon failure
 *
 * @param {string} mediaId - The Meta media ID.
 * @param {string} accessToken - The Meta Bearer access token.
 * @returns {Promise<{ fileName: string, fileUrl: string, fileType: string, fileSize: number }>}
 */
async function downloadMetaMedia(mediaId, accessToken) {
  if (!mediaId) {
    throw new Error('Meta media download failed: mediaId is required.');
  }

  const token = accessToken || process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new Error('Meta media download failed: No access token provided or configured in environment.');
  }

  let destinationPath = null;

  try {
    // Step 1: Call GET https://graph.facebook.com/v19.0/${mediaId} to retrieve media metadata
    const metadataResponse = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 15000,
    });

    const { url, mime_type, file_size } = metadataResponse.data;
    if (!url) {
      throw new Error(`Meta media metadata response missing download URL for mediaId: ${mediaId}`);
    }

    // Pre-validation from metadata if available
    if (file_size && parseInt(file_size, 10) > MAX_FILE_SIZE) {
      throw new Error(`File size ${file_size} bytes exceeds maximum allowed limit of 25MB.`);
    }

    if (mime_type) {
      const cleanMetaMime = mime_type.split(';')[0].trim().toLowerCase();
      const normalizedMetaMime = cleanMetaMime === 'image/jpg' ? 'image/jpeg' : cleanMetaMime;
      if (!ALLOWED_MIME_TYPES.has(normalizedMetaMime)) {
        throw new Error(`Security validation failed: MIME type '${mime_type}' is not allowed.`);
      }
    }

    // Step 2: Request the binary data stream
    const fileResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'curl/7.64.1',
      },
      responseType: 'stream',
      timeout: 45000,
    });

    // Step 3: Enforce Content-Length validation
    const contentLengthHeader = fileResponse.headers['content-length'];
    if (contentLengthHeader) {
      const contentLength = parseInt(contentLengthHeader, 10);
      if (contentLength > MAX_FILE_SIZE) {
        throw new Error(`File size ${contentLength} bytes exceeds the maximum allowed limit of 25MB.`);
      }
    }

    // Step 4: Enforce strict Content-Type validation
    const incomingContentType = (fileResponse.headers['content-type'] || mime_type || '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    const effectiveMimeType = incomingContentType === 'image/jpg' ? 'image/jpeg' : incomingContentType;

    if (!ALLOWED_MIME_TYPES.has(effectiveMimeType)) {
      throw new Error(`Security validation failed: Content-Type '${effectiveMimeType}' is not allowed.`);
    }

    // Step 5: Determine file extension from validated MIME type
    const extension = getExtensionFromMime(effectiveMimeType);

    // Step 6: Generate unique random filename
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const fileName = `meta_${timestamp}_${randomSuffix}${extension}`;

    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    destinationPath = path.resolve(uploadsDir, fileName);

    // Step 7: Stream to disk with real-time size enforcement
    await new Promise((resolve, reject) => {
      const fileWriteStream = fs.createWriteStream(destinationPath);
      let downloadedBytes = 0;

      fileResponse.data.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (downloadedBytes > MAX_FILE_SIZE) {
          const limitError = new Error(`File download aborted: exceeded maximum limit of 25MB (${MAX_FILE_SIZE} bytes).`);
          fileResponse.data.destroy(limitError);
          fileWriteStream.destroy(limitError);
        }
      });

      fileResponse.data.pipe(fileWriteStream);

      fileWriteStream.on('finish', resolve);
      fileWriteStream.on('error', reject);
      fileResponse.data.on('error', reject);
    });

    // Step 8: Determine final file size
    let finalFileSize = file_size ? parseInt(file_size, 10) : null;
    if (!finalFileSize || isNaN(finalFileSize)) {
      try {
        const stats = fs.statSync(destinationPath);
        finalFileSize = stats.size;
      } catch {
        finalFileSize = 0;
      }
    }

    return {
      fileName,
      fileUrl: `/uploads/${fileName}`,
      fileType: effectiveMimeType,
      fileSize: finalFileSize,
    };
  } catch (err) {
    // Clean up partial or corrupted file upon failure or abort
    if (destinationPath) {
      try {
        if (fs.existsSync(destinationPath)) {
          await fs.promises.unlink(destinationPath);
        }
      } catch (unlinkErr) {
        console.warn(`[Cleanup Warning]: Failed to delete partial file ${destinationPath}:`, unlinkErr.message);
      }
    }
    throw err;
  }
}

module.exports = {
  downloadMetaMedia,
  getExtensionFromMime,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};
