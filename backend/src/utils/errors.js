// Typed application error carrying an HTTP status and optional machine-readable code.
class ApiError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';
  }

  static badRequest(message, code) {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = 'Unauthorized', code) {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Forbidden', code) {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Not found', code) {
    return new ApiError(404, message, code);
  }

  static conflict(message, code) {
    return new ApiError(409, message, code);
  }
}

module.exports = { ApiError };
