const express = require('express');
const pool = require('../config/db');
const { verifierToken, verifierRole } = require('../middleware/auth');
const { scorer } = require('../services/ia');
const { logAudit } = require('../utils/audit');

const router = express.Router();
const etu = [verifierToken, verifierRole('etudiant', 'diplome')];

const TECH = ['Python', 'SQL', 'JavaScript', 'Réseaux', 'Sécurité', 'Linux', 'Machine Learning', 'Statistiques'];
const SOFT = ['Communication', 'Travail en équipe', 'Esprit analytique', 'Gestion de projet', 'Autonomie'];
const TOUTES = [...TECH, ...SOFT];

const FORMATIONS = {
  Python: 'Python for Everybody (Coursera)',
  SQL: 'Cours SQL (SQLBolt, OpenClassrooms)',
  JavaScript: 'freeCodeCamp : JavaScript',
  Réseaux: 'Cisco CCNA',
  Sécurité: 'CompTIA Security+ / Cisco CyberOps',
  Linux: 'LPIC-1 / Linux Foundation',
  'Machine Learning': 'Machine Learning (Coursera, Andrew Ng)',
  Statistiques: 'Statistiques pour la data science (Khan Academy)',
  'Gestion de projet': 'Certification Scrum Master / PMP',
};

async function dernierNiveaux(uid) {
  const r = await pool.query(
    'SELECT niveaux FROM evaluations WHERE utilisateur_id = $1 ORDER BY id DESC LIMIT 1',
    [uid]
  );
  return r.rows[0] ? r.rows[0].niveaux : null;
}

const scoreRegles = (niv, requis) => {
  const ks = Object.keys(requis);
  return ks.reduce((a, k) => a + Math.min(niv[k] || 0, requis[k]) / requis[k], 0) / ks.length;
};

router.get('/questionnaire', ...etu, (req, res) => res.json({ technique: TECH, soft: SOFT }));

router.post('/evaluation', ...etu, async (req, res) => {
  const propre = {};
  for (const [k, v] of Object.entries((req.body || {}).niveaux || {})) {
    const n = parseInt(v, 10);
    if (TOUTES.includes(k) && n >= 1 && n <= 5) propre[k] = n;
  }
  if (Object.keys(propre).length < 3)
    return res.status(400).json({ error: 'Évalue au moins 3 compétences' });
  try {
    await pool.query('INSERT INTO evaluations (utilisateur_id, niveaux) VALUES ($1, $2)', [
      req.user.id,
      JSON.stringify(propre),
    ]);
    await logAudit(req.user.id, 'AUTO_EVALUATION', req.ip);
    res.status(201).json({ message: 'Évaluation enregistrée' });
  } catch (e) {
    console.error('ERREUR ORIENTATION :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/recommandations', ...etu, async (req, res) => {
  try {
    const niv = await dernierNiveaux(req.user.id);
    if (!niv) return res.status(400).json({ error: "Fais d'abord l'auto-évaluation" });
    const metiers = (await pool.query('SELECT * FROM metiers')).rows;
    const query = Object.entries(niv)
      .filter(([, v]) => v >= 3)
      .map(([k]) => k)
      .join(' ');
    const items = metiers.map((m) => ({
      id: m.id,
      text: `${m.nom}. ${m.description} ${Object.keys(m.competences).join(' ')}`,
    }));
    const { mode, scores } = await scorer(query, items);
    const ia = new Map(scores.map((x) => [x.id, x.score]));
    const out = metiers
      .map((m) => {
        const regles = scoreRegles(niv, m.competences);
        const sem = ia.get(m.id) || 0;
        return {
          id: m.id,
          nom: m.nom,
          description: m.description,
          regles: Math.round(regles * 100),
          ia: Math.round(sem * 100),
          score: Math.round((0.8 * regles + 0.2 * sem) * 100),
        };
      })
      .sort((a, b) => b.score - a.score);
    res.json({ mode, metiers: out });
  } catch (e) {
    console.error('ERREUR ORIENTATION :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/ecarts/:id', ...etu, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Identifiant invalide' });
  try {
    const niv = await dernierNiveaux(req.user.id);
    if (!niv) return res.status(400).json({ error: "Fais d'abord l'auto-évaluation" });
    const r = await pool.query('SELECT * FROM metiers WHERE id = $1', [req.params.id]);
    const m = r.rows[0];
    if (!m) return res.status(404).json({ error: 'Métier introuvable' });
    const ecarts = Object.entries(m.competences)
      .map(([k, requis]) => ({
        competence: k,
        requis,
        actuel: niv[k] || 0,
        ecart: requis - (niv[k] || 0),
        formation: FORMATIONS[k] || 'Projet pratique et cours en ligne',
      }))
      .filter((e) => e.ecart > 0)
      .sort((a, b) => b.ecart - a.ecart || b.requis - a.requis);
    res.json({ metier: m.nom, ecarts });
  } catch (e) {
    console.error('ERREUR ORIENTATION :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;