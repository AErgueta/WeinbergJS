const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Middleware para registrar el cuerpo de la solicitud
/*router.use((req, res, next) => {
    console.log('Request Body:', req.body);
    next();
});*/

// Importar el modelo Customer
const Customer = require('../models/customer');
const Quotation = require('../models/customer'); // Asegúrate de tener el modelo Quotation definido
const QuotationCostDetail = require('../models/quotationCostDetail'); // Asegúrate que esto esté al inicio

const{isAuthenticated} = require('../helpers/auth');

//const { Customer, Quotation } = require('../models/customer'); //MODIFICADO

// Mostrar formulario para crear una nueva cotización
router.get('/customers/:customerId/quotations/new', isAuthenticated, async (req, res) => {
    const customerId = req.params.customerId;
    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).send('Customer not found');
        }
        res.render('quotes/new-quotation', { customerId }); // Asegúrate de pasar el customerId a la vista
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

router.post('/customers/:customerId/quotations', async (req, res) => {
    const customerId = req.params.customerId;
    const { fecha, fechaVence, descripcionCorta, detalles = [] } = req.body;

    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).send('Customer not found');
        }

        const newQuotation = {
            fecha,
            fechaVence,
            descripcionCorta,
            usuarioCreador: req.user ? req.user.name : 'Desconocido', // 👈 aquí se guarda el usuario
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
// routes/quotation.js

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

        // Asegúrate de que detalles es un array antes de mapearlo
        if (Array.isArray(detalles)) {
            quotation.detalles = detalles.map(detalle => ({
                lineaQuo: detalle.lineaQuo,
                tipoQuo: detalle.tipoQuo,
                cantidadQuo: detalle.cantidadQuo,
                descripcionQuo: detalle.descripcionQuo
            }));
        } else {
            // Manejo de caso en que detalles no sea un array, tal vez sea un solo objeto
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
        const customer = await Customer.findById(customerId); // 👈 sin .lean()

        if (!customer) {
            return res.status(404).send('Customer not found');
        }

        // Eliminar usando pull()
        customer.solicitudesCotizacion.pull({ _id: quotationId });

        await customer.save();

        res.redirect(`/customers/${customerId}/quotations`);
    } catch (error) {
        console.error('Error eliminando cotización:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

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
