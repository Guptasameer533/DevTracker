const logger = require('../utils/logger');
const { AppError } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const requestId = res.locals.requestId;

  if (err instanceof AppError && err.isOperational) {
    logger.warn('Operational error', {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      requestId,
    });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      requestId,
    });
  }

  // Unexpected errors: log full stack, return generic message
  logger.error('Unexpected error', {
    message: err.message,
    stack: err.stack,
    requestId,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  return res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    requestId,
  });
}

module.exports = errorHandler;
