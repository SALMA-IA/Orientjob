const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
console.log('DEBUG mot de passe:', JSON.stringify(process.env.DB_PASSWORD));

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

const authRoutes = require('./src/routes/auth');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.send('OrientJob API is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));