const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const pool = require('../config/db');
const { verifierToken } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

router.get('/statut', verifierToken, async (req, res) => {
  try {
    const r = await pool.query('SELECT mfa_active FROM utilisateurs WHERE id = $1', [req.user.id]);
    res.json({ mfa_active: !!(r.rows[0] && r.rows[0].mfa_active) });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/setup', verifierToken, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `OrientJob (${req.user.id})`,
      issuer: 'OrientJob',
    });
    await pool.query('UPDATE utilisateurs SET mfa_secret = $1, mfa_active = FALSE WHERE id = $2', [
      secret.base32,
      req.user.id,
    ]);
    res.json({ secret: secret.base32, qr: await QRCode.toDataURL(secret.otpauth_url) });
  } catch (e) {
    console.error('ERREUR MFA :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/activer', verifierToken, async (req, res) => {
  try {
    const r = await pool.query('SELECT mfa_secret FROM utilisateurs WHERE id = $1', [req.user.id]);
    const secret = r.rows[0] && r.rows[0].mfa_secret;
    const ok =
      secret &&
      speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: String((req.body || {}).code || ''),
        window: 1,
      });
    if (!ok) return res.status(400).json({ error: 'Code invalide' });
    await pool.query('UPDATE utilisateurs SET mfa_active = TRUE WHERE id = $1', [req.user.id]);
    await logAudit(req.user.id, 'MFA_ACTIVEE', req.ip);
    res.json({ message: 'MFA activée' });
  } catch (e) {
    console.error('ERREUR MFA :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;