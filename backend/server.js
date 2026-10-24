const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

app.use(cors({ origin: true }));
app.use(helmet());
app.use(express.json());
const { globalLimiter } = require('./src/middleware/limiter');
app.use('/api', globalLimiter);

const authRoutes = require('./src/routes/auth');
app.use('/api/auth', authRoutes);

const profilRoutes = require('./src/routes/profil');
app.use('/api/profil', profilRoutes);

app.use('/api/entreprise', require('./src/routes/entreprise'));
app.use('/api/admin', require('./src/routes/admin'));

app.use('/api/candidatures', require('./src/routes/candidatures'));

app.get('/', (req, res) => res.send('OrientJob API is running'));

const entrepriseRoutes = require('./src/routes/entreprise');
app.use('/api/entreprise', entrepriseRoutes);

const offresRoutes = require('./src/routes/offres');
app.use('/api/offres', offresRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

