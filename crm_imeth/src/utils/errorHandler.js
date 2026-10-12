const crypto = require('crypto');

/**
 * Centralized Express Error Handler
 *
 * Catches unhandled exceptions and errors from the route pipeline.
 * - In production: Masks internal errors, suppresses database stack traces,
 *   and outputs a correlation errorId.
 * - In development: Returns the raw error message and details for debugging.
 */
function handleRouteError(err, req, res, next) {
  const errorId = crypto.randomUUID();
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.statusCode || err.status || 500;

  console.error(`[Server Error ID: ${errorId}]:`, err.message);
  if (err.stack) {
    console.error(`[Server Stack ID: ${errorId}]:`, err.stack);
  }

  if (isProduction) {
    return res.status(statusCode).json({
      success: false,
      errorId,
      error: 'Internal Server Error',
    });
  }

  return res.status(statusCode).json({
    success: false,
    errorId,
    error: err.message || 'Internal Server Error',
    stack: err.stack,
  });
}

module.exports = { handleRouteError };
