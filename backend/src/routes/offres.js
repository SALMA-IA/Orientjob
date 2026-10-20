const express = require('express');
const pool = require('../config/db');
const { verifierToken, verifierRole } = require('../middleware/auth');

const router = express.Router();

// Publier une offre (recruteur uniquement)
router.post('/', verifierToken, verifierRole('recruteur'), async (req, res) => {
  const { titre, description, competencesRequises, ville, duree, type } = req.body;

  if (!titre) {
    return res.status(400).json({ error: 'Le titre est obligatoire' });
  }

  try {
    const entreprise = await pool.query(
      'SELECT id FROM entreprises WHERE utilisateur_id = $1',
      [req.user.id]
    );
    if (entreprise.rows.length === 0) {
      return res.status(400).json({ error: 'Aucune entreprise associée à ce compte' });
    }

    const result = await pool.query(
      `INSERT INTO offres (entreprise_id, type, titre, description, competences_requises, ville, duree)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [entreprise.rows[0].id, type || 'stage', titre, description, competencesRequises, ville, duree]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Lister les offres actives (avec filtres simples)
router.get('/', verifierToken, async (req, res) => {
  const { ville, type } = req.query;
  try {
    let query = `SELECT o.*, e.raison_sociale
                 FROM offres o
                 JOIN entreprises e ON e.id = o.entreprise_id
                 WHERE o.statut = $1`;
    const params = ['active'];

    if (type) {
      params.push(type);
      query += ` AND o.type = $${params.length}`;
    }
    if (ville) {
      params.push(`%${ville}%`);
      query += ` AND o.ville ILIKE $${params.length}`;
    }
    query += ' ORDER BY o.date_creation DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;