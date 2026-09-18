const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log detailed error on server console for developers/administrators
  console.error('💥 Server Error:', err);

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    const message = 'The requested item or resource could not be found.';
    return res.status(404).json({ success: false, message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    const cleanFieldName = field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .toLowerCase();
    const message = `A record with this ${cleanFieldName} already exists. Please use a different value.`;
    return res.status(400).json({ success: false, message });
  }

  // Mongoose validation error - Clean raw Mongoose path syntax
  if (err.name === 'ValidationError') {
    const rawMessages = err.errors ? Object.values(err.errors).map((val) => val.message) : [err.message];
    const cleanMessages = rawMessages.map((msg) => {
      // Clean "Path `xyz` is required." -> "Xyz is required."
      return msg
        .replace(/Path `(\w+)` is required\./gi, (_, p1) => {
          const formattedName = p1
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (s) => s.toUpperCase());
          return `${formattedName} is required.`;
        })
        .replace(/Path `(\w+)` \((.+)\) is less than minimum allowed value \((.+)\)\./gi, '$1 must be at least $3.');
    });

    const message = cleanMessages.join(' ') || 'Please ensure all required fields are filled correctly.';
    return res.status(400).json({ success: false, message });
  }

  // Multer upload errors
  if (err.name === 'MulterError') {
    let message = 'File upload error. Please try a different image.';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Image size is too large. Maximum allowed file size is 5MB.';
    }
    return res.status(400).json({ success: false, message });
  }

  // JSON parsing error in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request format. Please check your submission and try again.',
    });
  }

  // Default server error - Never leak raw stack traces or database errors to customer
  const statusCode = error.statusCode || err.statusCode || (typeof err.status === 'number' ? err.status : 500);
  const isProdOrSafe = process.env.NODE_ENV === 'production' || statusCode === 500;
  
  const userFriendlyMessage = statusCode === 500
    ? 'An unexpected error occurred while processing your request. Please try again or reach out on WhatsApp.'
    : (error.message || 'Something went wrong. Please try again.');

  res.status(statusCode).json({
    success: false,
    message: userFriendlyMessage,
  });
};

module.exports = errorHandler;
