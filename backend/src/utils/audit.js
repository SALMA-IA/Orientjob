const pool = require('../config/db');

async function logAudit(userId, action, ip) {
  try {
    await pool.query(
      'INSERT INTO journal_audit (utilisateur_id, action, adresse_ip) VALUES ($1, $2, $3)',
      [userId || null, action, ip]
    );
  } catch (e) { console.error('Audit :', e.message); }
}

module.exports = { logAudit };