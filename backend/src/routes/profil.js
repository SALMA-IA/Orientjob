const express = require('express');
const pool = require('../config/db');
const { verifierToken, verifierRole } = require('../middleware/auth');

const router = express.Router();

// Créer le profil (étudiant ou diplômé uniquement)
router.post('/', verifierToken, verifierRole('etudiant', 'diplome'), async (req, res) => {
  const { nom, prenom, formation, competences, cvUrl } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO profils_etudiants (utilisateur_id, nom, prenom, formation, competences, cv_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, nom, prenom, formation, competences, cvUrl]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Lire mon profil
router.get('/moi', verifierToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM profils_etudiants WHERE utilisateur_id = $1',
      [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;