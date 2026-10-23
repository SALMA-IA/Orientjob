const express = require('express');
const pool = require('../config/db');
const { verifierToken, verifierRole } = require('../middleware/auth');
const { analyserFraude, scorer } = require('../services/ia');
const { logAudit } = require('../utils/audit');

const router = express.Router();
const erreur = (res, e) => {
  console.error(e.message);
  res.status(500).json({ error: 'Erreur serveur' });
};

// Publier une offre (recruteur avec entreprise vérifiée)
router.post('/', verifierToken, verifierRole('recruteur'), async (req, res) => {
  const { titre, description, competencesRequises, ville, duree, type, experience,
    secteur, teletravail, typeContrat, salaire } = req.body;
  if (!titre || !description || !ville)
    return res.status(400).json({ error: 'Titre, description et ville obligatoires' });
  try {
    const ent = await pool.query(
      'SELECT id, statut_verification FROM entreprises WHERE utilisateur_id = $1', [req.user.id]);
    if (!ent.rows.length)
      return res.status(400).json({ error: "Renseigne d'abord ton entreprise" });
    if (ent.rows[0].statut_verification !== 'verifiee')
      return res.status(403).json({ error: "Entreprise non vérifiée par l'administrateur" });

    const fraude = await analyserFraude(titre, description);
    const statut = fraude.score_fiabilite >= 0.5 ? 'active' : 'en_moderation';

    const r = await pool.query(
      `INSERT INTO offres (entreprise_id, type, titre, description, competences_requises, ville,
        duree, experience, secteur, teletravail, type_contrat, salaire, score_fiabilite, statut,
        raisons_fraude)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [ent.rows[0].id, type === 'emploi' ? 'emploi' : 'stage', titre, description,
        competencesRequises || [], ville, duree || null, experience || null, secteur || null,
        !!teletravail, typeContrat || null, salaire || null, fraude.score_fiabilite, statut,
        (fraude.raisons || []).join(', ')]
    );
    await logAudit(req.user.id, `OFFRE_PUBLIEE_${r.rows[0].id}`, req.ip);
    res.status(201).json(r.rows[0]);
  } catch (e) { erreur(res, e); }
});

// Lister les offres actives avec filtres
router.get('/', verifierToken, async (req, res) => {
  const { ville, type, q, secteur, teletravail, typeContrat } = req.query;
  const p = ['active'];
  let sql = `SELECT o.*, e.raison_sociale FROM offres o
             JOIN entreprises e ON e.id = o.entreprise_id WHERE o.statut = $1`;
  const add = (cond, v) => {
    p.push(v);
    const n = p.length;
    sql += ` AND ${cond.replaceAll('?', () => '$' + n)}`;
  };
  if (type) add('o.type = ?', type);
  if (ville) add('o.ville ILIKE ?', `%${ville}%`);
  if (secteur) add('o.secteur ILIKE ?', `%${secteur}%`);
  if (typeContrat) add('o.type_contrat = ?', typeContrat);
  if (teletravail === 'true') add('o.teletravail = ?', true);
  if (q) add(`(o.titre ILIKE ? OR o.description ILIKE ? OR array_to_string(o.competences_requises, ' ') ILIKE ?)`, `%${q}%`);
  sql += ' ORDER BY o.date_creation DESC';
  try { res.json((await pool.query(sql, p)).rows); } catch (e) { erreur(res, e); }
});

// Mes offres (recruteur)
router.get('/mes-offres', verifierToken, verifierRole('recruteur'), async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT o.*, (SELECT COUNT(*) FROM candidatures c WHERE c.offre_id = o.id) AS nb_candidatures
       FROM offres o JOIN entreprises e ON e.id = o.entreprise_id
       WHERE e.utilisateur_id = $1 ORDER BY o.date_creation DESC`, [req.user.id]);
    res.json(r.rows);
  } catch (e) { erreur(res, e); }
});

// Offres recommandées (matching IA)
router.get('/recommandees', verifierToken, verifierRole('etudiant', 'diplome'), async (req, res) => {
  try {
    const type = req.user.role === 'diplome' ? 'emploi' : 'stage';
    const prof = await pool.query('SELECT * FROM profils_etudiants WHERE utilisateur_id = $1',
      [req.user.id]);
    if (!prof.rows.length) return res.status(400).json({ error: "Complète d'abord ton profil" });
    const p = prof.rows[0];
    const offres = await pool.query(
      `SELECT o.*, e.raison_sociale FROM offres o JOIN entreprises e ON e.id = o.entreprise_id
       WHERE o.statut = 'active' AND o.type = $1`, [type]);
    const query = `${p.formation || ''} ${(p.competences || []).join(' ')} ${p.ville || ''}`;
    const items = offres.rows.map((o) => ({
      id: o.id,
      text: `${o.titre}. ${o.description} ${(o.competences_requises || []).join(' ')} ${o.ville || ''}`,
    }));
    const { mode, scores } = await scorer(query, items);
    const map = new Map(scores.map((x) => [x.id, x.score]));
    const out = offres.rows.map((o) => ({ ...o, score: map.get(o.id) || 0 }))
      .sort((a, b) => b.score - a.score);
    res.json({ mode, offres: out });
  } catch (e) { erreur(res, e); }
});

// Détail d'une offre (doit rester en dernier)
router.get('/:id', verifierToken, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Identifiant invalide' });
  try {
    const r = await pool.query(
      `SELECT o.*, e.raison_sociale, e.utilisateur_id AS proprietaire FROM offres o
       JOIN entreprises e ON e.id = o.entreprise_id WHERE o.id = $1`, [req.params.id]);
    const o = r.rows[0];
    if (!o || (o.statut !== 'active' && req.user.role !== 'admin' && o.proprietaire !== req.user.id))
      return res.status(404).json({ error: 'Offre introuvable' });
    res.json(o);
  } catch (e) { erreur(res, e); }
});

module.exports = router;