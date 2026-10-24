const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pool = require('../config/db');
const { verifierToken, verifierRole } = require('../middleware/auth');
const { chiffrer, dechiffrer } = require('../utils/crypto');
const { logAudit } = require('../utils/audit');

const router = express.Router();
const DIR = path.join(__dirname, '../../uploads');
fs.mkdirSync(DIR, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, f, cb) =>
    f.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new Error('PDF uniquement (5 Mo max)')),
});

const etu = [verifierToken, verifierRole('etudiant', 'diplome')];

router.post('/', ...etu, async (req, res) => {
  const { nom, prenom, formation, competences, ville } = req.body;
  if (!nom || !prenom) return res.status(400).json({ error: 'Nom et prénom obligatoires' });
  try {
    const r = await pool.query(
      `INSERT INTO profils_etudiants (utilisateur_id, nom, prenom, formation, competences, ville)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (utilisateur_id) DO UPDATE
       SET nom = $2, prenom = $3, formation = $4, competences = $5, ville = $6
       RETURNING *`,
      [req.user.id, nom, prenom, formation || null,
        Array.isArray(competences) ? competences : [], ville || null]
    );
    await logAudit(req.user.id, 'PROFIL_MODIFIE', req.ip);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/moi', verifierToken, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM profils_etudiants WHERE utilisateur_id = $1', [req.user.id]);
    res.json(r.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/cv', ...etu, (req, res) => {
  upload.single('cv')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
    try {
      const p = await pool.query('SELECT id FROM profils_etudiants WHERE utilisateur_id = $1', [req.user.id]);
      if (!p.rows.length) return res.status(400).json({ error: "Enregistre d'abord ton profil" });
      const nom = `cv_${req.user.id}_${Date.now()}.enc`;
      fs.writeFileSync(path.join(DIR, nom), chiffrer(req.file.buffer));
      await pool.query('UPDATE profils_etudiants SET cv_url = $1 WHERE utilisateur_id = $2', [nom, req.user.id]);
      await logAudit(req.user.id, 'CV_ENVOYE', req.ip);
      res.json({ message: 'CV enregistré (chiffré AES-256)' });
    } catch (e) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
});

router.get('/cv', ...etu, async (req, res) => {
  try {
    const r = await pool.query('SELECT cv_url FROM profils_etudiants WHERE utilisateur_id = $1', [req.user.id]);
    if (!r.rows[0] || !r.rows[0].cv_url) return res.status(404).json({ error: 'Aucun CV' });
    const buf = dechiffrer(fs.readFileSync(path.join(DIR, path.basename(r.rows[0].cv_url))));
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;