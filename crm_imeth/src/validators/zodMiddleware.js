/**
 * Generic Express middleware to validate request payloads using Zod schemas.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate req.body against.
 * @returns {import('express').RequestHandler}
 */
const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const details = issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details,
    });
  }

  // Assign validated and sanitized data back to req.body
  req.body = result.data;
  next();
};

module.exports = { validateRequest };
module.exports.validateRequest = validateRequest;
