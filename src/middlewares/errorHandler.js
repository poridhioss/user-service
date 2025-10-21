
const { trace, SpanStatusCode } = require('@opentelemetry/api');
const { SemanticAttributes } = require('@opentelemetry/semantic-conventions');
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  const span = trace.getActiveSpan();


  logger.error('Error handling request', {
    errorMessage: err.message,
    httpUrl: req.originalUrl,
    httpMethod: req.method,
    clientIp: req.ip,
    errorStack: err.stack, // Include stack trace for debugging
  });

  if(span) {
    span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, err.status || 500);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: err.message || 'Internal Server Error',
    });
    span.recordException(err);
  }

  // send response to the console
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error'
    }
  });
};

module.exports = errorHandler;