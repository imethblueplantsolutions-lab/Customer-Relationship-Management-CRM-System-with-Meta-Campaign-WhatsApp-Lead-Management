const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const MIME_EXTENSION_MAP = {
  // Images
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  // Audio
  'audio/aac': '.aac',
  'audio/mp4': '.m4a',
  'audio/mpeg': '.mp3',
  'audio/amr': '.amr',
  'audio/ogg': '.ogg',
  'audio/opus': '.opus',
  'audio/wav': '.wav',
  // Video
  'video/mp4': '.mp4',
  'video/3gpp': '.3gp',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
  'video/x-msvideo': '.avi',
  // Documents & Application
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'application/json': '.json',
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
 *
 * Step 1: Call GET https://graph.facebook.com/v19.0/${mediaId} to retrieve { url, mime_type, file_size }.
 * Step 2: Request the binary data from url with responseType: 'stream' and Bearer Authorization.
 * Step 3: Determine file extension from mime_type (fallback to .bin).
 * Step 4: Generate a unique filename using timestamp and random bytes.
 * Step 5: Pipe the stream to path.resolve(process.cwd(), 'uploads', fileName).
 * Step 6: Return { fileName, fileUrl: '/uploads/' + fileName, fileType: mime_type, fileSize }.
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

  // Step 2: Request the binary data from url with responseType: 'stream' and Authorization header
  const fileResponse = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'curl/7.64.1',
    },
    responseType: 'stream',
    timeout: 45000,
  });

  // Step 3: Determine file extension from mime_type (fallback to .bin)
  const extension = getExtensionFromMime(mime_type);

  // Step 4: Generate a unique filename using timestamp and random bytes
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const fileName = `meta_${timestamp}_${randomSuffix}${extension}`;

  // Step 5: Pipe the stream to path.resolve(process.cwd(), 'uploads', fileName)
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const destinationPath = path.resolve(uploadsDir, fileName);

  await new Promise((resolve, reject) => {
    const fileWriteStream = fs.createWriteStream(destinationPath);
    fileResponse.data.pipe(fileWriteStream);

    fileWriteStream.on('finish', resolve);
    fileWriteStream.on('error', (streamError) => {
      fs.unlink(destinationPath, () => {});
      reject(streamError);
    });
    fileResponse.data.on('error', (streamError) => {
      fs.unlink(destinationPath, () => {});
      reject(streamError);
    });
  });

  // Step 6: Determine actual file size and return payload
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
    fileType: mime_type || 'application/octet-stream',
    fileSize: finalFileSize,
  };
}

module.exports = {
  downloadMetaMedia,
  getExtensionFromMime,
};
