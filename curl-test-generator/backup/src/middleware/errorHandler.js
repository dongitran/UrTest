export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      message: 'Database error',
      error:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Internal server error',
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: err.details,
    });
  }

  if (err.message && err.message.includes('retry')) {
    return res.status(500).json({
      success: false,
      message: 'AI processing failed after multiple retries',
      error:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Service temporarily unavailable',
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}
