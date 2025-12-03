const { error } = require('../utils/response');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9]{7,15}$/;

function validateEmail(value) {
  if (typeof value !== 'string') return false;
  return emailRegex.test(value.trim().toLowerCase());
}

function validatePhone(value) {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  return phoneRegex.test(String(value).trim());
}

function validateRequiredFields(payload = {}, fields = []) {
  const missing = fields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || value === '';
  });

  return {
    valid: missing.length === 0,
    missing
  };
}

function requireFields(fields = []) {
  return (req, res, next) => {
    const { valid, missing } = validateRequiredFields(req.body, fields);

    if (!valid) {
      return res
        .status(400)
        .json(
          error(
            `Missing required fields: ${missing.join(', ')}`,
            'VALIDATION_ERROR'
          )
        );
    }

    return next();
  };
}

function validateEmailField(field = 'email') {
  return (req, res, next) => {
    const value = req.body[field];
    if (value && !validateEmail(value)) {
      return res
        .status(400)
        .json(error(`Invalid ${field}`, 'VALIDATION_ERROR'));
    }

    return next();
  };
}

function validatePhoneField(field = 'phone') {
  return (req, res, next) => {
    const value = req.body[field];
    if (value && !validatePhone(value)) {
      return res
        .status(400)
        .json(error(`Invalid ${field}`, 'VALIDATION_ERROR'));
    }

    return next();
  };
}

module.exports = {
  validateEmail,
  validatePhone,
  validateRequiredFields,
  requireFields,
  validateEmailField,
  validatePhoneField
};

