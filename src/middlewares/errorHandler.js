
const { trace, SpanStatusCode, metrics } = require('@opentelemetry/api');
const { SemanticAttributes } = require('@opentelemetry/semantic-conventions');
const logger = require('../config/logger');


// Metrics Initialization
const meter = metrics.getMeter('user-service', '0.1.0');
const errorCounter = meter.createCounter('http_errors_total', {
  description: 'Total number of HTTP errors',
  unit: 'errors',
});

const errorHandler = (err, req, res, next) => {
  // get the current span from the tracing middleware
  const span = trace.getActiveSpan();
  const statusCode = err.status || 500;

  logger.error('Error handling request', {
    errorMessage: err.message,
    httpUrl: req.originalUrl,
    httpMethod: req.method,
    clientIp: req.ip,
    errorStack: err.stack,
  });

  if(span) {
    span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, statusCode);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: err.message || 'Internal Server Error',
    });
    span.recordException(err);
  }

  // Record error metric
  errorCounter.add(1, {
    [SemanticAttributes.HTTP_STATUS_CODE]: statusCode,
    'error.type': err.name || 'UnknownError',
  });

  // send response to the console
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error'
    }
  });
};

module.exports = errorHandler;