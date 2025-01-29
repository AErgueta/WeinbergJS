const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

//const Customer = require('../models/customer'); // Constante del modelo Customer
//const { Customer, Quotation } = require('../models/customer'); MODIFICADO
const Customer = require('../models/customer'); // Importar el modelo Customer
const { isAuthenticated } = require('../helpers/auth');


// Leer documentos
router.get('/customers', isAuthenticated, async (req, res) => {
    try {
        // Obtener todos los documentos de Customer y ordenarlos por nombreCus
        const customers = await Customer.find().sort({ nombreCus: 1 }); // 1 para orden ascendente, -1 para descendente
        //console.log(customers);
        res.render('quotes/all-customers', { customers }); // Renderizar la plantilla HTML con los datos
    } catch (error) {
        console.error(error); // Manejo de errores
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



// Escribir documentos
router.post('/customers', async (req, res) => {
    const { aliasCus, nombreCus, contactoCus, eMailCus, telefonoCus } = req.body; // Obtener datos del cuerpo de la solicitud
    try {
        const newCustomer = new Customer({ aliasCus, nombreCus, contactoCus, eMailCus, telefonoCus }); // Crear un nuevo documento de Customer
        await newCustomer.save(); // Guardar el nuevo documento en la base de datos
        //res.status(201).json({ message: 'Customer created successfully' }); // Devolver respuesta exitosa
        req.flash('success_msg', 'Cliente Insertado Correctamente');
        res.redirect('/customers');
    } catch (error) {
        console.error(error); // Manejo de errores
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Obtener la página de edición de un cliente
router.get('/customers/edit/:id', async (req, res) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID');
    }
    try {
        const customer = await Customer.findById(id).lean(); // Buscar el cliente por su ID
        if (!customer) {
            return res.status(404).send('Customer not found');
        }
        //console.log(customer)
        res.render('quotes/edit-customer', { customer }); // Renderizar la plantilla HTML con los datos del cliente
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
});

// Actualizar un cliente
router.put('/customers/edit/:id', async (req, res) => {
     const id = req.params.id;
    const { aliasCus, nombreCus, contactoCus, eMailCus, telefonoCus } = req.body;
    //console.log('Qué putas');
    try {
        await Customer.findByIdAndUpdate(req.params.id, { aliasCus, nombreCus, contactoCus, eMailCus, telefonoCus });
        req.flash('success_msg', 'Cliente Modificado Correctamente');
        res.redirect('/customers');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Borrar documento - cliente
router.delete('/customers/delete/:id', async(req, res) => {
    try {
        await Customer.findByIdAndDelete(req.params.id); // Buscar y eliminar el documento de Customer
        req.flash('success_msg', 'Cliente Eliminado Correctamente');
        res.redirect('/customers');
    } catch (error) {
        console.error(error); // Manejo de errores
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
