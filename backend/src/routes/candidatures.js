const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { verifierToken, verifierRole } = require('../middleware/auth');
const { scorer } = require('../services/ia');
const { dechiffrer } = require('../utils/crypto');
const { logAudit } = require('../utils/audit');

const router = express.Router();
const DIR = path.join(__dirname, '../../uploads');
const STATUTS = ['recue', 'en_cours', 'entretien', 'acceptee', 'refusee'];
const etu = [verifierToken, verifierRole('etudiant', 'diplome')];
const rec = [verifierToken, verifierRole('recruteur')];

const err500 = (res, e) => {
  console.error('ERREUR CANDIDATURES :', e && e.message);
  res.status(500).json({ error: 'Erreur serveur' });
};

// La candidature appartient-elle à une offre de ce recruteur ?
const possede = (cid, uid) =>
  pool.query(
    `SELECT c.*, p.cv_url FROM candidatures c
     JOIN profils_etudiants p ON p.id = c.profil_id
     JOIN offres o ON o.id = c.offre_id
     JOIN entreprises e ON e.id = o.entreprise_id
     WHERE c.id = $1 AND e.utilisateur_id = $2`,
    [cid, uid]
  );

router.post('/', ...etu, async (req, res) => {
  const { offreId } = req.body;
  try {
    const p = await pool.query('SELECT id FROM profils_etudiants WHERE utilisateur_id = $1', [req.user.id]);
    if (!p.rows.length) return res.status(400).json({ error: 'Complète ton profil avant de postuler' });
    const o = await pool.query("SELECT id FROM offres WHERE id = $1 AND statut = 'active'", [offreId]);
    if (!o.rows.length) return res.status(404).json({ error: 'Offre introuvable' });
    const r = await pool.query(
      'INSERT INTO candidatures (profil_id, offre_id) VALUES ($1, $2) RETURNING *',
      [p.rows[0].id, offreId]
    );
    await logAudit(req.user.id, `CANDIDATURE_${offreId}`, req.ip);
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Tu as déjà postulé à cette offre' });
    err500(res, e);
  }
});

router.get('/mes', ...etu, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT c.*, o.titre, o.ville, o.type, en.raison_sociale FROM candidatures c
       JOIN profils_etudiants p ON p.id = c.profil_id
       JOIN offres o ON o.id = c.offre_id
       JOIN entreprises en ON en.id = o.entreprise_id
       WHERE p.utilisateur_id = $1 ORDER BY c.date_candidature DESC`,
      [req.user.id]
    );
    res.json(r.rows);
  } catch (e) {
    err500(res, e);
  }
});

// Candidats d'une offre, classés par score de pertinence
router.get('/offre/:offreId', ...rec, async (req, res) => {
  try {
    const o = await pool.query(
      `SELECT o.* FROM offres o JOIN entreprises e ON e.id = o.entreprise_id
       WHERE o.id = $1 AND e.utilisateur_id = $2`,
      [req.params.offreId, req.user.id]
    );
    if (!o.rows.length) return res.status(404).json({ error: 'Offre introuvable' });
    const c = await pool.query(
      `SELECT c.*, p.nom, p.prenom, p.formation, p.competences, p.ville,
              (p.cv_url IS NOT NULL AND p.cv_url <> '') AS a_cv
       FROM candidatures c JOIN profils_etudiants p ON p.id = c.profil_id
       WHERE c.offre_id = $1`,
      [req.params.offreId]
    );
    const off = o.rows[0];
    const query = `${off.titre} ${off.description} ${(off.competences_requises || []).join(' ')}`;
    const items = c.rows.map((x) => ({
      id: x.id,
      text: `${x.formation || ''} ${(x.competences || []).join(' ')} ${x.ville || ''}`,
    }));
    const { scores } = await scorer(query, items);
    const map = new Map(scores.map((x) => [x.id, x.score]));
    res.json(
      c.rows.map((x) => ({ ...x, score: map.get(x.id) || 0 })).sort((a, b) => b.score - a.score)
    );
  } catch (e) {
    err500(res, e);
  }
});

router.patch('/:id/statut', ...rec, async (req, res) => {
  const { statut } = req.body || {};
  if (!STATUTS.includes(statut)) return res.status(400).json({ error: 'Statut invalide' });
  try {
    if (!(await possede(req.params.id, req.user.id)).rows.length)
      return res.status(404).json({ error: 'Candidature introuvable' });
    const r = await pool.query(
      'UPDATE candidatures SET statut = $1 WHERE id = $2 RETURNING *',
      [statut, req.params.id]
    );
    await logAudit(req.user.id, `STATUT_${statut.toUpperCase()}_${req.params.id}`, req.ip);
    res.json(r.rows[0]);
  } catch (e) {
    err500(res, e);
  }
});

router.patch('/:id/match', ...rec, async (req, res) => {
  try {
    if (!(await possede(req.params.id, req.user.id)).rows.length)
      return res.status(404).json({ error: 'Candidature introuvable' });
    const r = await pool.query(
      `UPDATE candidatures SET match_recruteur = TRUE,
         statut = CASE WHEN statut = 'recue' THEN 'en_cours' ELSE statut END
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    await logAudit(req.user.id, `MATCH_${req.params.id}`, req.ip);
    res.json(r.rows[0]);
  } catch (e) {
    err500(res, e);
  }
});

// Le recruteur propriétaire télécharge le CV (déchiffré à la volée)
router.get('/:id/cv', ...rec, async (req, res) => {
  try {
    const r = await possede(req.params.id, req.user.id);
    if (!r.rows.length || !r.rows[0].cv_url) return res.status(404).json({ error: 'CV introuvable' });
    const buf = dechiffrer(fs.readFileSync(path.join(DIR, path.basename(r.rows[0].cv_url))));
    await logAudit(req.user.id, `CV_CONSULTE_${req.params.id}`, req.ip);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buf);
  } catch (e) {
    err500(res, e);
  }
});

module.exports = router;