// Importing required modules
const express = require("express");
const app = express();
const helmet = require("helmet");
const cors = require("cors");
const hpp = require("hpp");
const xss = require("xss-clean");
const path = require('path');
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");
const errorHandler = require("./utils/errorHandler");
const adminRoute = require('./routes/admin/adminRoute');
const customerRoute = require('./routes/customer/customerRoute');

// Enable express parser for parsing JSON request bodies
app.use(express.json({ 
  limit: "50mb",
  verify: (req, res, buf) => { req.rawBody = buf } // Store raw body for webhooks
}));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d', // Cache static files for 1 day
  etag: true
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  crossOriginOpenerPolicy: process.env.NODE_ENV === 'production'
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security attack prevention
app.use(hpp()); // prevent HTTP Parameter Pollution
app.use(xss()); // prevent Cross-Site Scripting (XSS)
app.use(mongoSanitize()); // prevent NoSQL injection

// Logging middleware
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    skip: function (req, res) {
      return res.statusCode === 304 || req.path === '/health'; // Skip logging for 304 responses and health checks
    },
  })
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

//API section
app.use('/api/v1/admin', adminRoute);
app.use('/api/v1/client', customerRoute);

// Global error handler
app.use(errorHandler);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ 
    status: 'error',
    message: 'Route not found'
  });
});

// Export the app module
module.exports = app;
