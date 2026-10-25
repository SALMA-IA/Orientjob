const express = require('express');
const pool = require('../config/db');
const { verifierToken } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

router.post('/', verifierToken, async (req, res) => {
  const { offreId, motif } = req.body || {};
  if (!offreId || !motif || motif.trim().length < 5)
    return res.status(400).json({ error: 'Motif trop court (5 caractères min.)' });
  try {
    const o = await pool.query('SELECT id FROM offres WHERE id = $1', [offreId]);
    if (!o.rows.length) return res.status(404).json({ error: 'Offre introuvable' });
    const r = await pool.query(
      'INSERT INTO signalements (auteur_id, offre_id, motif) VALUES ($1, $2, $3) RETURNING id',
      [req.user.id, offreId, motif.trim()]
    );
    await logAudit(req.user.id, `SIGNALEMENT_OFFRE_${offreId}`, req.ip);
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error('ERREUR SIGNALEMENTS :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;