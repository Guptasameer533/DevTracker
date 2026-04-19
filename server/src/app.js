const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const requestId = require('./middleware/requestId');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth.routes');
const reposRoutes = require('./routes/repos.routes');
const statsRoutes = require('./routes/stats.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://avatars.githubusercontent.com'],
      connectSrc: ["'self'", 'https://api.github.com'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));

// CORS: only allow the configured frontend origin
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Request-Id'],
}));

// Body parsing — cap at 100kb to guard against large payload DoS
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Middleware: request ID injection (must be before morgan so it appears in logs)
app.use(requestId);

// Access logging
app.use(morgan(
  (tokens, req, res) => {
    const line = [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      `${tokens['response-time'](req, res)}ms`,
      `req:${req.requestId}`,
      req.user ? `user:${req.user.id}` : '',
    ].filter(Boolean).join(' ');
    return line;
  },
  {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.path === '/api/v1/health',
  }
));

// General rate limit (auth routes have their own stricter limiter)
app.use(generalLimiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/repos', reposRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/health', healthRoutes);

// 404 handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
    requestId: res.locals.requestId,
  });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

module.exports = app;
