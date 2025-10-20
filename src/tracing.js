require('dotenv').config();
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { SimpleLogRecordProcessor, LoggerProvider } = require('@opentelemetry/sdk-logs');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const instrumentations = getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-express': { enabled: true },
    '@opentelemetry/instrumentation-pg': { enabled: true },
    '@opentelemetry/instrumentation-redis': { enabled: true },
    '@opentelemetry/instrumentation-grpc': { enabled: true },    
});

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://tempo:4317',
  }),
  logRecordProcessor: new SimpleLogRecordProcessor(
    new OTLPLogExporter({
      url: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT || 'http://otel-collector:4318/v1/logs',
    })
  ),
  instrumentations: [instrumentations],
  serviceName: process.env.OTEL_SERVICE_NAME || 'user-service',
});

function initTracing() {
    sdk.start();
    console.log('OpenTelemetry tracing initialized'); // Console log for early feedback
  
    process.on('SIGTERM', () => {
      sdk
        .shutdown()
        .then(() => console.log('OpenTelemetry tracing shut down'))
        .catch((error) => console.error('Error shutting down OpenTelemetry:', error))
        .finally(() => process.exit(0));
    });
  }
  
// Initialize tracing immediately
initTracing();
  
// Export for use in other modules if needed
module.exports = { initTracing };