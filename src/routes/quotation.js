const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Importar el modelo Customer
const Customer = require('../models/customer');
const QuotationCostDetail = require('../models/quotationCostDetail');
const { isAuthenticated } = require('../helpers/auth');

// Mostrar formulario para crear una nueva cotización
router.get('/customers/:customerId/quotations/new', isAuthenticated, async (req, res) => {
    const customerId = req.params.customerId;
    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).send('Customer not found');
        }
        res.render('quotes/new-quotation', { customerId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Leer documentos de solicitudes de cotización para un cliente específico
router.get('/customers/:customerId/quotations', async (req, res) => {
    const customerId = req.params.customerId;
    try {
        const customer = await Customer.findById(customerId).lean();
        if (!customer) {
            return res.status(404).send('Customer not found');
        }
        const quotations = customer.solicitudesCotizacion;
        res.render('quotes/customer-quotations', { customer, quotations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Crear nueva solicitud de cotización
router.post('/customers/:customerId/quotations', async (req, res) => {
    const customerId = req.params.customerId;
    const { fecha, fechaVence, descripcionCorta, detalles = [] } = req.body;

    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).send('Customer not found');
        }

        // --- Generar código ---
        let codigoCotizacion = '';
        const alias = customer.aliasCus.toUpperCase();
        const ultimaCotizacion = customer.solicitudesCotizacion.slice(-1)[0]; // última

        if (!ultimaCotizacion) {
            // primera vez
            codigoCotizacion = `${alias}001-A`;
        } else {
            const ultimoCodigo = ultimaCotizacion.codigoCotizacion; // ej. "ABC005-A"
            const match = ultimoCodigo.match(/(\D+)(\d{3})-([A-Z])/);

            if (match) {
                const prefix = match[1];   // alias
                let numero = parseInt(match[2]); // 005
                let letra = match[3];      // A

                numero++;
                if (numero > 999) {
                    numero = 1;
                    letra = String.fromCharCode(letra.charCodeAt(0) + 1); // siguiente letra
                }

                codigoCotizacion = `${prefix}${numero.toString().padStart(3, '0')}-${letra}`;
            } else {
                // fallback si algo falla
                codigoCotizacion = `${alias}001-A`;
            }
        }

        // Crear la nueva cotización
        const newQuotation = {
            codigoCotizacion,   // 👈 lo nuevo
            fecha,
            fechaVence,
            descripcionCorta,
            usuarioCreador: req.user ? req.user.name : 'Desconocido',
            detalles: detalles.map(detalle => ({
                lineaQuo: detalle.lineaQuo,
                tipoQuo: detalle.tipoQuo,
                cantidadQuo: detalle.cantidadQuo,
                descripcionQuo: detalle.descripcionQuo
            }))
        };

        customer.solicitudesCotizacion.push(newQuotation);
        await customer.save();

        res.redirect(`/customers/${customerId}/quotations`);
    } catch (error) {
        console.error('Error during saving:', error);
        res.status(500).json({ message: 'Internal Server Error (writing)' });
    }
});

// Obtener la página de edición de una solicitud de cotización
router.get('/customers/:customerId/quotations/edit/:quotationId', isAuthenticated, async (req, res) => {
    const { customerId, quotationId } = req.params;
    try {
        const customer = await Customer.findById(customerId).lean();
        if (!customer) return res.status(404).send('Customer not found');

        const quotation = customer.solicitudesCotizacion.find(q => q._id.toString() === quotationId);
        if (!quotation) return res.status(404).send('Quotation not found');

        // Para cada detalle, verificamos si hay cálculos guardados
        const detallesConCalculos = await Promise.all(
            quotation.detalles.map(async (detalle) => {
                const detalleId = detalle._id;
                const calculo = await QuotationCostDetail.findOne({ detalleId }).lean();
                return {
                    ...detalle,
                    tieneCalculos: !!(calculo && calculo.calculos && calculo.calculos.length > 0)
                };
            })
        );

        res.render('quotes/edit-quotation', {
            customer,
            quotation,
            detalles: detallesConCalculos
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Actualizar una solicitud de cotización
router.put('/customers/:customerId/quotations/edit/:quotationId', async (req, res) => {
    const { customerId, quotationId } = req.params;
    const { fecha, fechaVence, descripcionCorta, detalles } = req.body;
    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).send('Customer not found');
        }
        const quotation = customer.solicitudesCotizacion.id(quotationId);
        if (!quotation) {
            return res.status(404).send('Quotation not found');
        }
        quotation.fecha = fecha;
        quotation.fechaVence = fechaVence;
        quotation.descripcionCorta = descripcionCorta;

        if (Array.isArray(detalles)) {
            quotation.detalles = detalles.map(detalle => ({
                lineaQuo: detalle.lineaQuo,
                tipoQuo: detalle.tipoQuo,
                cantidadQuo: detalle.cantidadQuo,
                descripcionQuo: detalle.descripcionQuo
            }));
        } else {
            quotation.detalles = [{
                lineaQuo: detalles.lineaQuo,
                tipoQuo: detalles.tipoQuo,
                cantidadQuo: detalles.cantidadQuo,
                descripcionQuo: detalles.descripcionQuo
            }];
        }

        await customer.save();
        res.redirect(`/customers/${customerId}/quotations`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Borrar documento
router.delete('/customers/:customerId/quotations/delete/:quotationId', async (req, res) => {
    const { customerId, quotationId } = req.params;

    try {
        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).send('Customer not found');
        }

        customer.solicitudesCotizacion.pull({ _id: quotationId });

        await customer.save();

        res.redirect(`/customers/${customerId}/quotations`);
    } catch (error) {
        console.error('Error eliminando cotización:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Guardar edición con POST
router.post('/customers/:customerId/quotations/edit/:quotationId', async (req, res) => {
    const { customerId, quotationId } = req.params;
    const { fecha, fechaVence, descripcionCorta, detalles = [] } = req.body;

    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).send('Customer not found');
        }

        const quotation = customer.solicitudesCotizacion.id(quotationId);
        if (!quotation) {
            return res.status(404).send('Quotation not found');
        }

        quotation.fecha = fecha;
        quotation.fechaVence = fechaVence;
        quotation.descripcionCorta = descripcionCorta;
        quotation.detalles = detalles.map(detalle => ({
            lineaQuo: detalle.lineaQuo,
            tipoQuo: detalle.tipoQuo,
            cantidadQuo: detalle.cantidadQuo,
            descripcionQuo: detalle.descripcionQuo
        }));

        await customer.save();
        res.redirect(`/customers/${customerId}/quotations`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
