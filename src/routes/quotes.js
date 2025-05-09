const express = require('express');
const router = express.Router();

const Customer = require('../models/customer'); // Modelo de cliente
const Cost = require('../models/cost');         // Modelo de costos

const QuotationCostDetail = require('../models/quotationCostDetail'); // ✅ Líneas del cálculo


// 👉 Ruta para formulario de nuevo cliente
router.get('/quotes/add', (req, res) => {
    res.render('quotes/new-client');
});

// 👉 Ruta para procesar nuevo cliente
router.post('/quotes/new-client', (req, res) => {
    const { alias, nombre, nombreC, eMail, telf } = req.body;
    const errors = [];

    if (!alias) errors.push({ text: 'Por favor inserte el Alias' });
    if (!nombre) errors.push({ text: 'Por favor digite el nombre del cliente' });
    if (!nombreC) errors.push({ text: 'Por favor digite el nombre del contacto' });
    if (!eMail) errors.push({ text: 'Por favor digite el eMail' });
    if (!telf) errors.push({ text: 'Por favor digite el número de teléfono' });

    if (errors.length > 0) {
        res.render('quotes/new-client', {
            errors, alias, nombre, nombreC, eMail, telf
        });
    } else {
        res.send('Ok');
    }
});

// ✅ NUEVA RUTA: Resumen de Cálculo de Costos (pantalla de resultados)
router.get('/calculatorResumen', async (req, res) => {
    const { quotationId, customerId, detailIndex } = req.query;

    try {
        const customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).send('Cliente no encontrado');

        const quotation = customer.solicitudesCotizacion.id(quotationId);
        if (!quotation) return res.status(404).send('Cotización no encontrada');

        const detalle = quotation.detalles[detailIndex];
        if (!detalle) return res.status(404).send('Detalle no encontrado');

        const detalleId = detalle._id;

        // 🔹 Buscar el documento que contiene todos los cálculos para este detalle
        const costDocument = await QuotationCostDetail.findOne({ detalleId }).lean();
        if (!costDocument) return res.status(404).send('No hay cálculos guardados para este detalle');

        // 🔹 Enviar todos los cálculos al HBS
        res.render('quotes/calculatorResumen', {
            quotation,
            customer,
            detalle,
            calculos: costDocument.calculos
        });

    } catch (error) {
        console.error("Error en /calculatorResumen:", error);
        res.status(500).send("Error interno del servidor.");
    }
});

// Ruta base de quotes
router.get('/quotes', (req, res) => {
    res.send('Clientes de la Base de Datos');
});

module.exports = router;
