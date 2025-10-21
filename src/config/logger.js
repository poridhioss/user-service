const { logs } = require('@opentelemetry/api-logs');
const { SeverityNumber } = require('@opentelemetry/api-logs');

// Get the logger provider
const loggerProvider = logs.getLoggerProvider();
const logger = loggerProvider.getLogger('user-service', '0.1.0');

const log = {
  info: (message, attributes = {}) => {
    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: 'INFO',
      body: message,
      attributes,
    });
  },
  error: (message, attributes = {}) => {
    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: 'ERROR',
      body: message,
      attributes,
    });
  },
  warn: (message, attributes = {}) => {
    logger.emit({
      severityNumber: SeverityNumber.WARN,
      severityText: 'WARN',
      body: message,
      attributes,
    });
  },
  debug: (message, attributes = {}) => {
    logger.emit({
      severityNumber: SeverityNumber.DEBUG,
      severityText: 'DEBUG',
      body: message,
      attributes,
    });
  },
};

module.exports = log;