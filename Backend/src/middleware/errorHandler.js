const { error } = require('../utils/response');

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'ERROR');
  const message =
    status >= 500 ? 'Internal server error' : err.message || 'Request failed';

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', err);
  }

  const payload = error(message, code);

  if (err.details) {
    payload.details = err.details;
  }

  return res.status(status).json(payload);
}

module.exports = errorHandler;

