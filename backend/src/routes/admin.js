const express = require('express');
const pool = require('../config/db');
const { verifierToken, verifierRole } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();
const admin = [verifierToken, verifierRole('admin')];

router.get('/entreprises', ...admin, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT e.*, u.email FROM entreprises e JOIN utilisateurs u ON u.id = e.utilisateur_id
       WHERE e.statut_verification = $1 ORDER BY e.id`,
      [req.query.statut || 'en_attente']
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.patch('/entreprises/:id', ...admin, async (req, res) => {
  const { statut } = req.body;
  if (!['verifiee', 'refusee'].includes(statut)) return res.status(400).json({ error: 'Statut invalide' });
  try {
    const r = await pool.query(
      'UPDATE entreprises SET statut_verification = $1 WHERE id = $2 RETURNING *',
      [statut, req.params.id]
    );
    await logAudit(req.user.id, `ENTREPRISE_${statut.toUpperCase()}_${req.params.id}`, req.ip);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

module.exports = router;