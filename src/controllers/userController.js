const { trace, SpanStatusCode, metrics } = require('@opentelemetry/api');
const { SemanticAttributes } = require('@opentelemetry/semantic-conventions');
const userService = require('../services/userService');
const logger = require('../config/logger');


// Metrics Initialization
const meter = metrics.getMeter('user-service', '0.1.0');
const dbQueryCounter = meter.createCounter('db_queries_total', {
  description: 'Total number of database queries',
  unit: 'queries',
});
const dbQueryDuration = meter.createHistogram('db_query_duration_seconds', {
  description: 'Database query latency in seconds',
  unit: 'seconds',
  advice: {
    explicitBucketBoundaries: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.5, 1],
  },
});
const userCreatedCounter = meter.createCounter('users_created_total', {
  description: 'Total number of users created',
  unit: 'users',
});
const activeUsersCounter = meter.createUpDownCounter('active_users', {
  description: 'Number of active users',
  unit: 'users',
});


class UserController {
  async createUser(req, res, next) {
    const span = trace.getActiveSpan(); // Get the active span from middleware
    try {
      span.addEvent('User creation started');

      // calculate user creation time
      const startTime = Date.now();
      const user = await userService.createUser(req.body);
      const durationSeconds = (Date.now() - startTime) / 1000;
      
      // set span attr and event
      span.setAttribute('app.user.id', user.id);
      span.addEvent('User creation completed', { 
        'app.user.id': user.id 
      });

      // log
      logger.info('User created', {
        userId: user.id,
      });

      // Record Metrics
      dbQueryCounter.add(1, { 'db.operation': 'INSERT', 'db.status': 'success' });
      dbQueryDuration.record(durationSeconds, { 'db.operation': 'INSERT' });
      userCreatedCounter.add(1, { status: 'success' });
      activeUsersCounter.add(1);

      // send the response
      res.status(201).json(user);
    } catch (error) {

      // log
      logger.error('Error creating user', {
        error: error.message,
        userId: req.body.id || 'unknown',
      });

      //span
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      
      //metric
      userCreatedCounter.add(1, { status: 'failure' });
      next(error);
    }
  }

  async getUser(req, res, next) {
    const span = trace.getActiveSpan();
    try {
      span.setAttribute('app.user.id', req.params.id);

      // calculate
      const startTime = Date.now();
      const user = await userService.getUser(req.params.id);
      const durationSeconds = (Date.now() - startTime) / 1000;

      // log
      logger.info('User retrieved', {
        userId: req.params.id,
      });

      // metrics
      dbQueryCounter.add(1, { 'db.operation': 'SELECT', 'db.status': 'success' });
      dbQueryDuration.record(durationSeconds, { 'db.operation': 'SELECT' });

      // send response
      res.json(user);
    } catch (error) {
      logger.error('Error getting user', {
        error: error.message,
        userId: req.params.id,
      });
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      dbQueryCounter.add(1, { 'db.operation': 'SELECT', 'db.status': 'failure' });
      next(error);
    }
  }

  async updateUser(req, res, next) {
    const span = trace.getActiveSpan();
    try {
      span.setAttribute('app.user.id', req.params.id);

      const startTime = Date.now()
      const user = await userService.updateUser(req.params.id, req.body);
      const durationSeconds = (Date.now() - startTime) / 1000;

      logger.info('User updated', {
        userId: req.params.id,
      });

      dbQueryCounter.add(1, { 'db.operation': 'UPDATE', 'db.status': 'success' });
      dbQueryDuration.record(durationSeconds, { 'db.operation': 'UPDATE' });

      res.json(user);
    } catch (error) {
      logger.error('Error updating user', {
        error: error.message,
        userId: req.params.id,
      });
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      dbQueryCounter.add(1, { 'db.operation': 'UPDATE', 'db.status': 'failure' });
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    const span = trace.getActiveSpan();
    try {
      span.setAttribute('app.user.id', req.params.id);

      const startTime = Date.now();
      await userService.deleteUser(req.params.id);
      const durationSeconds = (Date.now() - startTime) / 1000;

      logger.info('User deleted', {
        userId: req.params.id,
      });

      dbQueryCounter.add(1, { 'db.operation': 'DELETE', 'db.status': 'success' });
      dbQueryDuration.record(durationSeconds, { 'db.operation': 'DELETE' });
      activeUsersCounter.add(-1);

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting user', {
        error: error.message,
        userId: req.params.id,
      });
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      dbQueryCounter.add(1, { 'db.operation': 'DELETE', 'db.status': 'failure' });
      next(error);
    }
  }

  async getAllUsers(req, res, next) {
    const span = trace.getActiveSpan();
    try {

      const startTime = Date.now()
      const users = await userService.getAllUsers();
      const durationSeconds = (Date.now() - startTime) / 1000;

      span.setAttribute('app.users.count', users.length);

      logger.info('Retrieved all users', {
        userCount: users.length,
      });

      dbQueryCounter.add(1, { 'db.operation': 'SELECT', 'db.status': 'success' });
      dbQueryDuration.record(durationSeconds, { 'db.operation': 'SELECT' });

      res.json(users);
    } catch (error) {
      logger.error('Error getting all users', {
        error: error.message,
      });
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      dbQueryCounter.add(1, { 'db.operation': 'SELECT', 'db.status': 'failure' });
      next(error);
    }
  }
}

module.exports = new UserController();