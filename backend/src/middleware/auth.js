const jwt = require('jsonwebtoken');

function verifierToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token manquant' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = decoded; // { id, role }
    next();
  });
}

function verifierRole(...rolesAutorises) {
  return (req, res, next) => {
    if (!rolesAutorises.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé pour ce rôle' });
    }
    next();
  };
}

module.exports = { verifierToken, verifierRole };