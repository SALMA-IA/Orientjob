const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO utilisateurs (email, mot_de_passe_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, hash, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM utilisateurs WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });

    const valid = await bcrypt.compare(password, user.mot_de_passe_hash);
    if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, role: user.role, userId: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;