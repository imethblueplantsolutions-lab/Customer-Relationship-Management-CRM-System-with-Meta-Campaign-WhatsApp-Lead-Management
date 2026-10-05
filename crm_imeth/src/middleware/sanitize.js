/**
 * Input Sanitization & Anti-Prototype Pollution Middleware
 *
 * Recursively scrubs incoming requests:
 * 1. Strips basic HTML tags from string values to mitigate stored/reflected XSS.
 * 2. Drops dangerous prototype pollution keys ('__proto__', 'constructor', 'prototype').
 * 3. Recursively processes nested objects and arrays across req.body, req.query, and req.params.
 */

/**
 * Recursively sanitizes a value, array, or object.
 *
 * @param {*} data - Input data to sanitize
 * @returns {*} Sanitized output
 */
function sanitizePayload(data) {
  if (data === null || data === undefined) {
    return data;
  }

  // Strip basic HTML tags from strings
  if (typeof data === 'string') {
    return data.replace(/<[^>]*>?/gm, '');
  }

  // Recursively process arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizePayload(item));
  }

  // Recursively process plain objects
  if (typeof data === 'object') {
    const clean = {};
    for (const key of Object.keys(data)) {
      // Prevent prototype pollution attacks
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      clean[key] = sanitizePayload(data[key]);
    }
    return clean;
  }

  // Primitives (numbers, booleans) return unchanged
  return data;
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params.
 */
function sanitizeMiddleware(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizePayload(req.body);
    }

    if (req.query && typeof req.query === 'object') {
      try {
        req.query = sanitizePayload(req.query);
      } catch (err) {
        // Fallback for non-configurable req.query getter
        for (const key of Object.keys(req.query)) {
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            delete req.query[key];
          } else {
            req.query[key] = sanitizePayload(req.query[key]);
          }
        }
      }
    }

    if (req.params && typeof req.params === 'object') {
      try {
        req.params = sanitizePayload(req.params);
      } catch (err) {
        for (const key of Object.keys(req.params)) {
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            delete req.params[key];
          } else {
            req.params[key] = sanitizePayload(req.params[key]);
          }
        }
      }
    }
  } catch (error) {
    console.warn('[Sanitize Middleware Warning]:', error.message);
  }

  next();
}

module.exports = sanitizeMiddleware;
module.exports.sanitizePayload = sanitizePayload;
module.exports.sanitizeMiddleware = sanitizeMiddleware;
