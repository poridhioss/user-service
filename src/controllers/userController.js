const { trace, SpanStatusCode } = require('@opentelemetry/api');
const userService = require('../services/userService');
const logger = require('../config/logger');

class UserController {
  async createUser(req, res, next) {
    const span = trace.getActiveSpan(); // Get the active span from middleware
    try {
      span.addEvent('User creation started');
      const user = await userService.createUser(req.body);
      span.setAttribute('app.user.id', user.id);
      span.addEvent('User creation completed', { 
        'app.user.id': user.id 
      });

      logger.info('User created', {
        userId: user.id,
      });

      res.status(201).json(user);
    } catch (error) {
      logger.error('Error creating user', {
        error: error.message,
        userId: req.body.id || 'unknown',
      });
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      next(error);
    }
  }

  async getUser(req, res, next) {
    const span = trace.getActiveSpan();
    try {
      span.setAttribute('app.user.id', req.params.id);
      const user = await userService.getUser(req.params.id);

      logger.info('User retrieved', {
        userId: req.params.id,
      });
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
      next(error);
    }
  }

  async updateUser(req, res, next) {
    const span = trace.getActiveSpan();
    try {
      span.setAttribute('app.user.id', req.params.id);
      const user = await userService.updateUser(req.params.id, req.body);

      logger.info('User updated', {
        userId: req.params.id,
      });
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
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    const span = trace.getActiveSpan();
    try {
      span.setAttribute('app.user.id', req.params.id);
      await userService.deleteUser(req.params.id);

      logger.info('User deleted', {
        userId: req.params.id,
      });
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
      next(error);
    }
  }

  async getAllUsers(req, res, next) {
    const span = trace.getActiveSpan();
    try {
      const users = await userService.getAllUsers();
      span.setAttribute('app.users.count', users.length);

      logger.info('Retrieved all users', {
        userCount: users.length,
      });
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
      next(error);
    }
  }
}

module.exports = new UserController();