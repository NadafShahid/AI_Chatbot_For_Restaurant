function success(message, data = null) {
  const payload = {
    success: true,
    message
  };

  if (data !== null && data !== undefined) {
    payload.data = data;
  }

  return payload;
}

function error(message, code = 'ERROR', details) {
  const payload = {
    success: false,
    error: {
      code,
      message
    }
  };

  if (details) {
    payload.details = details;
  }

  return payload;
}

module.exports = {
  success,
  error
};

