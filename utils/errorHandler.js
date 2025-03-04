// Middleware for handling errors globally
function errorHandler(err, req, res, next) {
  // Log error details for internal use
  console.error(`[Error] ${err.status || 500} - ${err.message}`);

  // Check if the error is a server error (5xx) or a client error (4xx)
  if (res.headersSent) {
    // If headers are already sent, delegate to the default Express error handler
    return next(err);
  }

  // Set the HTTP status code
  res.status(err.status || 500);

  // Send a JSON response with the error details
  res.json({
    error: {
      message: err.message || "An unexpected error occurred",
      status: err.status || 500,
    },
  });
}

module.exports = errorHandler;
