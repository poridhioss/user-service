const { trace, SpanStatusCode, metrics } = require('@opentelemetry/api');
const { SemanticAttributes } = require('@opentelemetry/semantic-conventions');


// Metrics Initialization
const meter = metrics.getMeter('user-service', '0.1.0');
const requestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
  unit: 'requests',
});
const requestDuration = meter.createHistogram('http_request_duration_seconds', {
  description: 'HTTP request latency in seconds',
  unit: 'seconds',
  advice: {
    explicitBucketBoundaries: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  },
});



function tracingMiddleware(req, res, next) {
  // create a user-service tracer
  const tracer = trace.getTracer('user-service');
  const startTime = Date.now();
  
  // Get the route path (e.g., '/api/users/:id') or fallback to URL path
  const routePath = req.route ? req.route.path : req.path;
  console.log("tracingMiddleware Invoked by ", routePath);

  // Start a span for the request
  return tracer.startActiveSpan(`${req.method} ${routePath}`, (span) => {
    try {
      // Set standard HTTP attributes
      span.setAttribute(SemanticAttributes.HTTP_METHOD, req.method);
      span.setAttribute(SemanticAttributes.HTTP_ROUTE, routePath);
      span.setAttribute(SemanticAttributes.HTTP_URL, req.url);
      span.setAttribute(SemanticAttributes.HTTP_HOST, req.hostname);

      // Store the original res.end to capture response completion
      const originalEnd = res.end;

      // Override res.end to set status code and end the span
      res.end = function (...args) {

        // calculate value and attr
        const durationSeconds = (Date.now() - startTime) / 1000;
        const attributes = {
          [SemanticAttributes.HTTP_METHOD]: req.method,
          [SemanticAttributes.HTTP_ROUTE]: routePath,
          [SemanticAttributes.HTTP_STATUS_CODE]: res.statusCode,
        };

        // Record metrics
        requestCounter.add(1, attributes);
        requestDuration.record(durationSeconds, attributes);

        // set span attribute
        span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, res.statusCode);
        span.end();
        return originalEnd.apply(res, args);
      };

      // Handle errors by setting span status
      const onError = (error) => {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        span.recordException(error);
        span.end();
      };

      // Listen for error events
      res.once('error', onError);

      // Proceed to the next middleware/controller
      next();

      // Clean up error listener if no error occurs
      res.once('finish', () => {
        res.removeListener('error', onError);
      });
    } catch (error) {
      // Ensure span is ended if middleware setup fails
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      span.end();
      next(error);
    }
  });
}

module.exports = tracingMiddleware;