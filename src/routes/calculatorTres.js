const express = require('express');
//const router = express.Router();
const router = express.Router({ mergeParams: true });
const Customer = require('../models/customer'); // Importamos el modelo correcto
const Cost = require('../models/cost'); // Importamos el modelo Cost

// Función para formatear fechas a dd/mm/yyyy
function formatDate(date) {
    if (!date) return ''; // Si no hay fecha, retorna vacío
    const fechaObj = new Date(date);
    const dia = String(fechaObj.getDate()).padStart(2, '0');
    const mes = String(fechaObj.getMonth() + 1).padStart(2, '0'); // +1 porque los meses van de 0 a 11
    const anio = fechaObj.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

router.get('/calculatorTres', async (req, res) => {
    try {
        const quotationId = req.query.quotationId;
        const customerId = req.query.customerId;
        const detailIndex = parseInt(req.query.detailIndex, 10);

        if (!quotationId || !customerId) {
            return res.status(400).send("Faltan parámetros: ID de cotización o ID de cliente");
        }

        // 🔍 1. Buscar el cliente en la base de datos
        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).send("Cliente no encontrado");
        }

        // 🔍 2. Buscar la cotización dentro del array `solicitudesCotizacion`
        const quotation = customer.solicitudesCotizacion.find(q => q._id.toString() === quotationId);

        if (!quotation) {
            return res.status(404).send("Cotización no encontrada");
        }

        // 🔍 3. Obtener el detalle de la línea específica
        const detalle = quotation.detalles && quotation.detalles.length > detailIndex
            ? quotation.detalles[detailIndex]
            : {};

        // 🔹 Formateamos las fechas antes de enviarlas a la vista
        const formattedQuotation = {
            ...quotation.toObject(), // Convertimos a objeto plano para evitar conflictos con Mongoose
            fecha: formatDate(quotation.fecha),
            fechaVence: formatDate(quotation.fechaVence)
        };
        const detalleId = detalle && detalle._id ? detalle._id.toString() : '';
        // 🔍 4. Enviar los datos a la vista
        res.render('calculatorTres', {
            quotationId,
            customerId,
            quotation: formattedQuotation,
            detalle,
            detalleId,
            user: req.user //Para almacenar usuario
        });

    } catch (error) {
        console.error("Error en calculatorTres:", error);
        res.status(500).send("Error interno del servidor");
    }
});

// Ruta para obtener artículos de tipo PAPEL
router.get('/api/articulos/papel', async (req, res) => {
    try {
        const articulos = await Cost.find({ codigoCT: /^PAP/ }).sort({ descCT: 1 }); // Buscar códigos que inicien con "PAP"
        res.json(articulos);
    } catch (error) {
        console.error("Error al obtener artículos de Papel:", error);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});

// Ruta para obtener detalles del artículo por código
router.get('/api/articulos/detalle', async (req, res) => {
    try {
        const codigo = req.query.codigo; // Obtener el código del artículo desde la query string
        if (!codigo) {
            return res.status(400).json({ error: "Código de artículo no proporcionado" });
        }

        // Buscar el artículo en la base de datos por el código
        const articulo = await Cost.findOne({ codigoCT: codigo });

        if (!articulo) {
            return res.status(404).json({ error: "Artículo no encontrado" });
        }

        // Devolver los detalles del artículo
        res.json({
            montoCT: articulo.montoCT,
            descCT: articulo.descCT,
            factorCT: articulo.factorCT
        });
    } catch (error) {
        console.error("Error al obtener detalles del artículo:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Nueva API para obtener detalles de un artículo específico
router.get('/api/articulo/:codigoCT', async (req, res) => {
    try {
        const articulo = await Cost.findOne({ codigoCT: req.params.codigoCT });

        if (!articulo) {
            return res.status(404).json({ error: "Artículo no encontrado" });
        }

        res.json(articulo);
    } catch (error) {
        console.error("Error al obtener detalles del artículo:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Ruta para obtener artículos de tipo TINTA
router.get('/api/articulos/tinta', async (req, res) => {
    try {
        const articulos = await Cost.find({ codigoCT: /^TINF/ }); // Buscar códigos que inicien con "TINF"
        res.json(articulos);
    } catch (error) {
        console.error("Error al obtener artículos de Tinta:", error);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});

// Ruta para obtener artículos de tipo PLANCHA
router.get('/api/articulos/plancha', async (req, res) => {
    try {
        const articulos = await Cost.find({ codigoCT: /^PLA/ }); // Buscar códigos que inicien con "PLA"
        res.json(articulos);
    } catch (error) {
        console.error("Error al obtener artículos de Plancha:", error);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});

// Ruta para obtener artículos de tipo PELICULA
router.get('/api/articulos/pelicula', async (req, res) => {
    try {
        const articulos = await Cost.find({ codigoCT: /^PLX/ }); // Buscar códigos que inicien con "PLX"
        res.json(articulos);
    } catch (error) {
        console.error("Error al obtener artículos de Película:", error);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});
// Ruta para obtener artículos de tipo ACABADO
router.get('/api/articulos/acabado', async (req, res) => {
    try {
        const articulos = await Cost.find({ codigoCT: /^ACA/ }); // Buscar códigos que inicien con "ACA"
        res.json(articulos);
    } catch (error) {
        console.error("Error al obtener artículos de Acabado:", error);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});
// Ruta para obtener artículos de tipo PREPRENSA
router.get('/api/articulos/preprensa', async (req, res) => {
    try {
        const articulos = await Cost.find({ codigoCT: /^PRE/ }); // Buscar códigos que inicien con "PRE"
        res.json(articulos);
    } catch (error) {
        console.error("Error al obtener artículos de Preprensa:", error);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});
// Ruta para obtener artículos de tipo PLASTIFICADO
router.get('/api/articulos/plastificado', async (req, res) => {
    try {
        const articulos = await Cost.find({ codigoCT: /^PLS/ }); // Buscar códigos que inicien con "PLS"
        res.json(articulos);
    } catch (error) {
        console.error("Error al obtener artículos de Plastificado:", error);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});
// Ruta para obtener artículos de tipo MANO DE OBRA
router.get('/api/articulos/mano-obra', async (req, res) => {
    try {
        const articulos = await Cost.find({ codigoCT: /^MO2/ }); // Buscar códigos que inicien con "MO2"
        res.json(articulos);
    } catch (error) {
        console.error("Error al obtener artículos de Mano de Obra:", error);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});
// Ruta para obtener artículos de tipo GASTOS INDIRECTOS
router.get('/api/articulos/gastosindirectos', async (req, res) => {
    try {
        const articulos = await Cost.find({ codigoCT: /^CI2/ }); // Buscar códigos que inicien con "CI2"
        res.json(articulos);
    } catch (error) {
        console.error("Error al obtener artículos de Costos Indirectos:", error);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});
// Ruta para obtener artículos de tipo GASTOS OPERATIVOS
router.get('/api/articulos/gastosoperativos', async (req, res) => {
    try {
        const articulos = await Cost.find({ codigoCT: /^GOP/ }); // Buscar códigos que inicien con "GOP"
        res.json(articulos);
    } catch (error) {
        console.error("Error al obtener artículos de Gastos Operativos:", error);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});
// Ruta para obtener artículos de tipo UTILIDAD
router.get('/api/articulos/utilidad', async (req, res) => {
    try {
        const articulos = await Cost.find({ codigoCT: /^MAU/ }); // Buscar códigos que inicien con "MAU"
        res.json(articulos);
    } catch (error) {
        console.error("Error al obtener artículos de Utilidad:", error);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});

module.exports = router;
