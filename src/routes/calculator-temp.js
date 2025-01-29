const express = require('express');
const router = express.Router();
const Customer = require('../models/customer'); // Importa el modelo Customer
const { isAuthenticated } = require('../helpers/auth');

// Ruta para mostrar el formulario de cotización
router.get('/quotes/calculator', isAuthenticated, async (req, res) => {
    const quotationId = req.query.quotationId;

    try {
        const customer = await Customer.findOne({ 'solicitudesCotizacion._id': quotationId });
        if (customer) {
            const quotation = customer.solicitudesCotizacion.id(quotationId);
            res.render('quotes/calculator', { quotation, customer });
        } else {
            res.status(404).send('Quotation not found');
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

// Ruta para manejar la cotización
router.post('/quotes/calculator', isAuthenticated, async (req, res) => {
    const { details, quotationId, customerId } = req.body;

    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            console.error('Customer not found');
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }
        console.log('Customer found:', customer);

        const quotation = customer.solicitudesCotizacion.id(quotationId);
        if (!quotation) {
            console.error('Quotation not found');
            return res.status(404).json({ success: false, error: 'Quotation not found' });
        }
        console.log('Quotation found:', quotation);

        // Actualizar los detalles de la cotización
        quotation.detalles = details;

        await customer.save();
        res.json({ success: true, quotation });
    } catch (err) {
        console.error('Error saving quotation:', err); // Verifica cualquier error en el servidor
        res.status(500).json({ success: false, error: err });
    }
});

module.exports = router;
