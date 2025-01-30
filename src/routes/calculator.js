const express = require('express');
const router = express.Router();
const Customer = require('../models/customer'); // Modelo del cliente
const Cost = require('../models/cost'); // Modelo del costo
const { isAuthenticated } = require('../helpers/auth');

// Ruta para mostrar el formulario de cotización
router.get('/quotes/calculator', isAuthenticated, async (req, res) => {
    const { quotationId, customerId, detailIndex } = req.query;

    try {
        // Validación de customerId, quotationId y detailIndex
        if (!quotationId || !customerId || detailIndex === undefined) {
            return res.status(400).send('Missing required parameters: quotationId, customerId, or detailIndex');
        }

        const index = parseInt(detailIndex, 10); // Convertir detailIndex a número entero
        if (isNaN(index)) {
            return res.status(400).send('Invalid detailIndex format');
        }

        // Buscar el cliente
        const customer = await Customer.findById(customerId);
        if (!customer) {
            console.error(`Customer with ID ${customerId} not found`);
            return res.status(404).send('Customer not found');
        }

        // Buscar la cotización dentro del cliente
        const quotation = customer.solicitudesCotizacion.id(quotationId);
        if (!quotation) {
            console.error(`Quotation with ID ${quotationId} not found in customer ${customerId}`);
            return res.status(404).send('Quotation not found');
        }

        // Validar el índice del detalle
        if (index < 0 || index >= quotation.detalles.length) {
            console.error(`Invalid detailIndex ${index} for quotation ${quotationId}`);
            return res.status(400).send('Detail index out of range');
        }

        // Buscar el detalle dentro de la cotización
        const detail = quotation.detalles[index];
        //console.log(detail);
        if (!detail) {
            console.error(`Detail not found at index ${index} in quotation ${quotationId}`);
            return res.status(404).send('Detail not found');
        }

        // Obtiene los documentos de la colección Cost que comienzan con "PAP"
        // Incluyendo explícitamente los campos necesarios: codigoCT, montoCT, descCT y factorCT
        const paperCosts = await Cost.find(
            { codigoCT: { $regex: /^PAP/ } }, // Filtro para costos que comienzan con "PAP"
            { codigoCT: 1, montoCT: 1, descCT: 1, factorCT: 1 } // Campos seleccionados
        );

        // Renderiza la vista y envía los datos de los códigos, detalles y cliente
        res.render('quotes/calculator', { 
            quotation, 
            detail, 
            customer, 
            paperCosts 
        });
    } catch (err) {
        // Manejo de errores
        console.error(err);
        res.status(500).send('Internal server error. Please try again later.');
    }
});

// Nueva ruta: Obtener dinámicamente los detalles del papel basado en el códigoCT
router.get('/quotes/get-factor/:codigoCT', isAuthenticated, async (req, res) => {
    const { codigoCT } = req.params; // Obtener el código del papel desde los parámetros de la ruta

    try {
        // Validar el código del papel
        if (!codigoCT || typeof codigoCT !== 'string' || codigoCT.trim() === '') {
            return res.status(400).json({ error: 'Invalid or missing codigoCT' });
        }

        // Buscar el costo por códigoCT
        const cost = await Cost.findOne(
            { codigoCT }, // Filtrar por el códigoCT
            { factorCT: 1, montoCT: 1, descCT: 1 } // Seleccionar los campos necesarios
        );

        if (!cost) {
            console.error(`Cost with codigoCT ${codigoCT} not found`);
            return res.status(404).json({ error: 'Cost not found' });
        }

        // Retornar los datos como respuesta JSON
        res.json({
            factor: cost.factorCT,      // Factor del papel
            precio: cost.montoCT,       // Precio del papel
            descripcion: cost.descCT    // Descripción del papel
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
