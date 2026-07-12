// routes/api.js
const express = require('express');
const router = express.Router();
const Cost = require('../models/cost');
require('dotenv').config();

// ========================================================
// RUTAS ORIGINALES DEL SISTEMA
// ========================================================

router.get('/articles', async (req, res) => {
    const { filter } = req.query;
    try {
        const query = filter ? { codigoCT: { $regex: `^${filter}` } } : {};
        const articles = await Cost.find(query, 'codigoCT descCT montoCT factorCT')
                                   .sort({ descCT: 1 }); 
        res.json(articles);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar los artículos');
    }
});

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

// ========================================================
// NUEVA RUTA DE IA (CONEXIÓN DIRECTA SIN LIBRERÍA)
// ========================================================
router.post('/interpretar-pedido', async (req, res) => {
    try {
        const { textoCliente } = req.body;
        if (!textoCliente) return res.status(400).json({ error: "Falta el texto." });

        const apiKey = process.env.GEMINI_API_KEY;
        // URL directa a la API REST de Google
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const prompt = `
            Eres un experto analista de producción en una imprenta gráfica. 
            Tu tarea es leer el mensaje del cliente y extraer los datos técnicos en formato JSON.
            
            Reglas de estandarización:
            - Productos Compuestos: Si el producto tiene varias partes (ej. tapa e interior de un libro, o solapas de una carpeta), DETALLA cada parte dentro del mismo campo. 
              * Ejemplo en material: "Tapa: Couché 300g / Interior: Bond 75g"
              * Ejemplo en impresión: "Tapa: 4x4 / Interior: 1x1"
            - Colores/Impresión: Convierte "a un lado" o "solo tiro" a "4x0", "ambos lados" a "4x4", "blanco y negro" a "1x1" o "1x0".
            - Tamaños: Convierte términos comunes (Carta, Medio Oficio) a medidas exactas.
            - Acabados: Extrae procesos (Refilado, Plastificado Mate, Costura, etc.) en un arreglo. Especifica a qué parte aplica si es necesario (ej. "Plastificado Mate (Solo Tapa)").
            
            Mensaje del cliente: "${textoCliente}"
            
            Devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta:
            {
              "producto": "Nombre del producto",
              "cantidad": 0,
              "tamano": "Medidas exactas",
              "material": "Tipo de papel y gramaje (separar tapas/interiores si aplica)",
              "impresion": "Formato de color (separar tapas/interiores si aplica)",
              "acabados": ["acabado1", "acabado2"]
            }
        `;

        // Hacemos la petición nativa
        const googleResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await googleResponse.json();

        // Si Google devuelve un error, lo imprimimos claramente en la consola
        if (!googleResponse.ok) {
            console.error("❌ ERROR DIRECTO DE GOOGLE:", JSON.stringify(data, null, 2));
            return res.status(500).json({ error: "La API de Google rechazó la petición. Mira la terminal." });
        }

        // Si todo va bien, extraemos el texto de la respuesta cruda
        const responseText = data.candidates[0].content.parts[0].text;
        
        // Limpiamos la respuesta de Markdown a JSON puro
        const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        res.json(JSON.parse(jsonString));

    } catch (error) {
        console.error("❌ Error de servidor:", error);
        res.status(500).json({ error: "Error procesando el pedido en el servidor." });
    }
});

module.exports = router;