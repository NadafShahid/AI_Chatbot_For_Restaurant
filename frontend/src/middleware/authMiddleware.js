const { error } = require('../utils/response');

function extractUser(req) {
  if (req.user) return req.user;

  const { userId, userRole } = req.query;

  if (!userId) {
    return null;
  }

  const parsedId = Number.isNaN(Number(userId)) ? userId : Number(userId);

  return {
    id: parsedId,
    role: (userRole || 'customer').toString().toLowerCase()
  };
}

function requireUser(req, res, next) {
  const user = extractUser(req);

  if (!user || !user.id) {
    return res
      .status(401)
      .json(error('userId query parameter is required', 'AUTHENTICATION_ERROR'));
  }

  req.user = user;
  return next();
}

function requireAdmin(req, res, next) {
  const user = extractUser(req);

  if (!user || !user.id) {
    return res
      .status(401)
      .json(error('userId query parameter is required', 'AUTHENTICATION_ERROR'));
  }

  if (user.role !== 'admin') {
    return res
      .status(403)
      .json(error('Admin access required', 'AUTHORIZATION_ERROR'));
  }

  req.user = user;
  return next();
}

module.exports = {
  requireUser,
  requireAdmin
};

