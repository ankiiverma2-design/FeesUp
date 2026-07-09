const { ApiError } = require('../utils/errors');

/**
 * Validates a request part ('body' | 'query' | 'params') against a zod schema.
 * On success, replaces the request part with the parsed (coerced) value.
 */
const validate = (schema, part = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[part]);
  if (!result.success) {
    const fields = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return next(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR').withFields(fields));
  }
  req[part] = result.data;
  return next();
};

// Attach optional field details to ApiError without changing its constructor signature.
ApiError.prototype.withFields = function withFields(fields) {
  this.fields = fields;
  return this;
};

module.exports = { validate };
