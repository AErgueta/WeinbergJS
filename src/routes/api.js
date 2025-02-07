// routes/api.js
const express = require('express');
const router = express.Router();
const Cost = require('../models/cost'); // Asegúrate de importar el modelo correcto

// Ruta para obtener los artículos filtrados
router.get('/articles', async (req, res) => {
    const { filter } = req.query;
    try {
        const query = filter ? { codigoCT: { $regex: `^${filter}` } } : {};
        const articles = await Cost.find(query, 'codigoCT descCT montoCT factorCT')
                                   .sort({ descCT: 1 }); // Ordenar por descCT alfabéticamente
        res.json(articles);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar los artículos');
    }
});

// Ruta para obtener los detalles de un artículo específico
router.get('/articles/:codigoCT', async (req, res) => {
    const { codigoCT } = req.params;
    try {
        const article = await Cost.findOne({ codigoCT }, 'codigoCT descCT montoCT factorCT');
        if (!article) {
            return res.status(404).send('Artículo no encontrado');
        }
        res.json(article);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar los detalles del artículo');
    }
});

module.exports = router;