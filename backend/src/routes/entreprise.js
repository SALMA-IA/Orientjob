const express = require('express');
const pool = require('../config/db');
const { verifierToken, verifierRole } = require('../middleware/auth');

const router = express.Router();

// Créer ou mettre à jour son entreprise (recruteur uniquement)
router.post('/', verifierToken, verifierRole('recruteur'), async (req, res) => {
  const { raisonSociale, iceRc, secteur } = req.body;

  if (!raisonSociale) {
    return res.status(400).json({ error: 'La raison sociale est obligatoire' });
  }

  try {
    const existante = await pool.query(
      'SELECT id FROM entreprises WHERE utilisateur_id = $1',
      [req.user.id]
    );

    if (existante.rows.length > 0) {
      const result = await pool.query(
        `UPDATE entreprises
         SET raison_sociale=$1, ice_rc=$2, secteur=$3
         WHERE utilisateur_id=$4 RETURNING *`,
        [raisonSociale, iceRc, secteur, req.user.id]
      );
      return res.json(result.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO entreprises (utilisateur_id, raison_sociale, ice_rc, secteur)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, raisonSociale, iceRc, secteur]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Récupérer son entreprise
router.get('/moi', verifierToken, verifierRole('recruteur'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM entreprises WHERE utilisateur_id = $1',
      [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;