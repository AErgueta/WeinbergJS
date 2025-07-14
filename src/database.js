require('dotenv').config(); // ⬅️ Esto carga el archivo .env
const mongoose = require('mongoose');

// Usar la variable desde el archivo .env
const uri = process.env.MONGODB_URI;

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('DB is connected'))
    .catch(err => console.error('DB connection error:', err));
