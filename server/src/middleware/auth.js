const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function validateInput(rules) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, checks] of Object.entries(rules)) {
      const value = req.body[field] || req.params[field];

      if (checks.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      if (checks.minLength && value && value.length < checks.minLength) {
        errors.push({ field, message: `${field} must be at least ${checks.minLength} characters` });
      }

      if (checks.maxLength && value && value.length > checks.maxLength) {
        errors.push({ field, message: `${field} must be at most ${checks.maxLength} characters` });
      }

      if (checks.pattern && value && !checks.pattern.test(value)) {
        errors.push({ field, message: `${field} has invalid format` });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
}

function sanitizeHTML(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function sanitizeInput(req, res, next) {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHTML(req.body[key].trim());
      }
    }
  }
  next();
}

module.exports = { authMiddleware, validateInput, sanitizeHTML, sanitizeInput };
