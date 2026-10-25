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

router.get('/signalements', ...admin, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT s.*, o.titre, u.email AS auteur FROM signalements s
       JOIN offres o ON o.id = s.offre_id
       JOIN utilisateurs u ON u.id = s.auteur_id
       WHERE s.statut = 'ouvert' ORDER BY s.id DESC`
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.patch('/signalements/:id', ...admin, async (req, res) => {
  const { action } = req.body || {};
  if (!['masquer', 'rejeter'].includes(action))
    return res.status(400).json({ error: 'Action invalide' });
  try {
    if (action === 'masquer')
      await pool.query(
        `UPDATE offres SET statut = 'refusee'
         WHERE id = (SELECT offre_id FROM signalements WHERE id = $1)`,
        [req.params.id]
      );
    await pool.query("UPDATE signalements SET statut = 'traite' WHERE id = $1", [req.params.id]);
    await logAudit(req.user.id, `SIGNALEMENT_${action.toUpperCase()}_${req.params.id}`, req.ip);
    res.json({ message: 'Signalement traité' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/offres-moderation', ...admin, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT o.*, e.raison_sociale FROM offres o
       JOIN entreprises e ON e.id = o.entreprise_id
       WHERE o.statut = 'en_moderation' ORDER BY o.id DESC`
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.patch('/offres/:id', ...admin, async (req, res) => {
  const { statut } = req.body || {};
  if (!['active', 'refusee'].includes(statut))
    return res.status(400).json({ error: 'Statut invalide' });
  try {
    const r = await pool.query(
      'UPDATE offres SET statut = $1 WHERE id = $2 RETURNING id, statut',
      [statut, req.params.id]
    );
    await logAudit(req.user.id, `OFFRE_${statut.toUpperCase()}_${req.params.id}`, req.ip);
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/audit', ...admin, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT j.id, j.action, j.adresse_ip, j.date_action, u.email
       FROM journal_audit j LEFT JOIN utilisateurs u ON u.id = j.utilisateur_id
       ORDER BY j.id DESC LIMIT 100`
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;