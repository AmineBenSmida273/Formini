require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Connexion DB
connectDB();

// Démarrage serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
