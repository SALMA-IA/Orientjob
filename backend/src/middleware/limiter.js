const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
windowMs: 15 * 60 * 1000, max: 30,
standardHeaders: true, legacyHeaders: false,
message: { error: 'Trop de tentatives, réessaie dans 15 minutes' },
});
const globalLimiter = rateLimit({
windowMs: 60 * 1000, max: 300,
standardHeaders: true, legacyHeaders: false,
message: { error: 'Trop de requêtes' },
});
module.exports = { authLimiter, globalLimiter };