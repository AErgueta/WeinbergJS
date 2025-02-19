const express = require('express');
const router = express.Router();
const Customer = require('../models/customer'); // Importamos el modelo correcto

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

        // 🔍 4. Enviar los datos a la vista
        res.render('calculatorTres', {
            quotationId,
            customerId,
            quotation: formattedQuotation,
            detalle
        });

    } catch (error) {
        console.error("Error en calculatorTres:", error);
        res.status(500).send("Error interno del servidor");
    }
});

module.exports = router;
