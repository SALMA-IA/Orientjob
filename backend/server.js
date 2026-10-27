const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const https = require('https');
require('dotenv').config();

const { globalLimiter } = require('./src/middleware/limiter');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: true }));
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use('/api', globalLimiter);

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/profil', require('./src/routes/profil'));
app.use('/api/entreprise', require('./src/routes/entreprise'));
app.use('/api/offres', require('./src/routes/offres'));
app.use('/api/candidatures', require('./src/routes/candidatures'));
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/signalements', require('./src/routes/signalements'));
app.use('/api/orientation', require('./src/routes/orientation'));
app.use('/api/mfa', require('./src/routes/mfa'));
app.use('/api/admin', require('./src/routes/admin'));

app.get('/', (req, res) => res.send('OrientJob API is running'));

app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Erreur serveur' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`HTTP sur le port ${PORT}`));

if (fs.existsSync('certs/key.pem') && fs.existsSync('certs/cert.pem')) {
  const HTTPS_PORT = process.env.HTTPS_PORT || 5443;
  https
    .createServer(
      { key: fs.readFileSync('certs/key.pem'), cert: fs.readFileSync('certs/cert.pem') },
      app
    )
    .listen(HTTPS_PORT, () => console.log(`HTTPS sur le port ${HTTPS_PORT}`));
}