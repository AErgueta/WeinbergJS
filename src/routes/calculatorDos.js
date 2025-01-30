// routes/calculatorDos.js
const express = require('express');
const router = express.Router();
const Customer = require('../models/customer'); // Asegúrate de importar el modelo correcto

// Ruta para mostrar calculatorDos.hbs
router.get('/quotes/calculatorDos', async (req, res) => {
    const { quotationId, customerId, detailIndex } = req.query;

    try {
        // Validación de customerId, quotationId y detailIndex
        if (!quotationId || !customerId || detailIndex === undefined) {
            return res.status(400).send('Missing required parameters: quotationId, customerId, or detailIndex');
        }

        // Buscar el cliente y la cotización
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).send('Customer not found');
        }

        const quotation = customer.solicitudesCotizacion.id(quotationId);
        if (!quotation) {
            return res.status(404).send('Quotation not found');
        }

        // Validar el índice del detalle
        const index = parseInt(detailIndex, 10);
        if (isNaN(index) || index < 0 || index >= quotation.detalles.length) {
            return res.status(400).send('Invalid detailIndex');
        }

        // Obtener el detalle correspondiente
        const detail = quotation.detalles[index];

        // Formatear las fechas a YYYY-MM-DD
        const formatDate = (date) => {
            if (!date) return ''; // Si no hay fecha, devuelve una cadena vacía
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0'); // Meses van de 0 a 11
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Renderizar la vista con los datos de la cabecera y el detalle
        res.render('quotes/calculatorDos', {
            cabecera: {
                fecha: formatDate(quotation.fecha),
                fechaVence: formatDate(quotation.fechaVence),
                descripcionCorta: quotation.descripcionCorta,
            },
            detalle: detail, // Enviamos el detalle a la vista
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error. Please try again later.');
    }
});

module.exports = router;