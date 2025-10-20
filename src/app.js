require('./tracing');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middlewares/errorHandler');
const tracingMiddleware = require('./middlewares/tracing');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(tracingMiddleware);

app.use('/api/users', userRoutes);

app.use(errorHandler);

module.exports = app;