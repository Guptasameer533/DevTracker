/**
 * Consistent response helpers. All API responses go through these.
 * Shape:
 *   success: { success: true, data, meta? }
 *   error:   { success: false, message, code, requestId, errors? }
 */

function success(res, data, statusCode = 200, meta = undefined) {
  const body = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
}

function error(res, message, statusCode = 500, code = 'INTERNAL_ERROR', errors = undefined) {
  const body = {
    success: false,
    message,
    code,
    requestId: res.locals.requestId,
  };
  if (errors !== undefined) body.errors = errors;
  return res.status(statusCode).json(body);
}

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

module.exports = { success, error, AppError };
