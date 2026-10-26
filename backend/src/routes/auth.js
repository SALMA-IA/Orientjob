const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authLimiter } = require('../middleware/limiter');
const { logAudit } = require('../utils/audit');
const speakeasy = require('speakeasy');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES_PUBLICS = ['etudiant', 'diplome', 'recruteur'];

router.post('/register', authLimiter, async (req, res) => {
  const { email, password, role } = req.body;
  if (!EMAIL_RE.test(email || '')) return res.status(400).json({ error: 'Email invalide' });
  if (!password || password.length < 8)
    return res.status(400).json({ error: 'Mot de passe : 8 caractères minimum' });
  if (!ROLES_PUBLICS.includes(role)) return res.status(400).json({ error: 'Rôle invalide' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      'INSERT INTO utilisateurs (email, mot_de_passe_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email.toLowerCase(), hash, role]
    );
    await logAudit(r.rows[0].id, 'INSCRIPTION', req.ip);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email déjà utilisé' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


router.post('/login', authLimiter, async (req, res) => {
  const { email, password, code } = req.body || {};
  try {
    const r = await pool.query('SELECT * FROM utilisateurs WHERE email = $1', [
      (email || '').toLowerCase(),
    ]);
    const user = r.rows[0];
    const ok = user && (await bcrypt.compare(password || '', user.mot_de_passe_hash));
    if (!ok) {
      await logAudit(user && user.id, 'CONNEXION_ECHOUEE', req.ip);
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    if (user.mfa_active) {
      if (!code) return res.status(401).json({ error: 'Code MFA requis', mfaRequired: true });
      const valide = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: String(code),
        window: 1,
      });
      if (!valide) {
        await logAudit(user.id, 'MFA_ECHEC', req.ip);
        return res.status(401).json({ error: 'Code MFA invalide', mfaRequired: true });
      }
    }
    await logAudit(user.id, 'CONNEXION', req.ip);
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });
    res.json({ token, role: user.role, userId: user.id });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;