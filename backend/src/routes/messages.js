const express = require('express');
const pool = require('../config/db');
const { verifierToken } = require('../middleware/auth');
const router = express.Router();
async function acces(cid, uid) {
const r = await pool.query(
`SELECT c.match_etudiant, c.match_recruteur, p.utilisateur_id AS etu, e.utilisateur_id AS rec
FROM candidatures c JOIN profils_etudiants p ON p.id = c.profil_id
JOIN offres o ON o.id = c.offre_id JOIN entreprises e ON e.id = o.entreprise_id
WHERE c.id = $1`, [cid]);
const c = r.rows[0];
if (!c || (c.etu !== uid && c.rec !== uid)) return { ok: false, code: 403, error: 'Accès refusé' };
if (!(c.match_etudiant && c.match_recruteur))
return { ok: false, code: 403, error: 'Messagerie bloquée : pas de match mutuel' };
return { ok: true };
}
router.get('/:cid', verifierToken, async (req, res) => {
if (!/^\d+$/.test(req.params.cid)) return res.status(400).json({ error: 'Identifiant invalide' });
try {
const a = await acces(req.params.cid, req.user.id);
if (!a.ok) return res.status(a.code).json({ error: a.error });
const r = await pool.query(
`SELECT m.id, m.contenu, m.type, m.date_envoi, (m.auteur_id = $2) AS moi
FROM messages m WHERE m.candidature_id = $1 ORDER BY m.date_envoi`, [req.params.cid, req.user.id]);
res.json(r.rows);
} catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});
router.post('/:cid', verifierToken, async (req, res) => {
const contenu = (req.body.contenu || '').trim();
if (!/^\d+$/.test(req.params.cid)) return res.status(400).json({ error: 'Identifiant invalide' });
if (!contenu || contenu.length > 2000) return res.status(400).json({ error: 'Message vide ou trop long' });
try {
const a = await acces(req.params.cid, req.user.id);
if (!a.ok) return res.status(a.code).json({ error: a.error });
const r = await pool.query(
`INSERT INTO messages (candidature_id, auteur_id, contenu, type)
VALUES ($1, $2, $3, 'texte') RETURNING id, contenu, date_envoi`,
[req.params.cid, req.user.id, contenu]);
res.status(201).json(r.rows[0]);
} catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});
module.exports = router;