const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied' });
  }

  // Support both "Bearer <token>" and raw "<token>"
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'codealpha_secret_jwt_key_2026_internship');
    req.user = decoded; // Contains { id: userId, username: ... }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or expired, access denied' });
  }
};
