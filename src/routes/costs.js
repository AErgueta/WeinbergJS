const express = require('express');
const router = express.Router();
const Cost = require('../models/cost'); // Importar el modelo Cost
const { isAuthenticated } = require('../helpers/auth');


// Ruta para obtener todos los costos
router.get('/costs', isAuthenticated, async (req, res) => {
    try {
        const costs = await Cost.find().sort({ codigoCT: 1 }); // Obteniendo todos los documentos de la colección costs
        //console.log("Costs cargados desde MongoDB:", costs); // Verifica en la consola si los datos se obtienen correctamente
        res.render('costs/all-costs', { costs }); // Pasa los datos a la vista
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar los costos');
    }
});



// Ruta para eliminar un costo
router.post('/costs/delete/:id', isAuthenticated, async (req, res) => {
    try {
        await Cost.findByIdAndDelete(req.params.id);
        res.redirect('/costs');
    } catch (error) {
        console.error('Error deleting cost:', error);
        res.status(500).send('Error al eliminar el costo');
    }
});

// Ruta para editar un costo (formulario de edición)
router.get('/costs/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const cost = await Cost.findById(req.params.id).lean();
        if (!cost) {
            return res.status(404).send('Costo no encontrado');
        }
        res.render('costs/edit-cost', { cost });
    } catch (error) {
        console.error('Error fetching cost for editing:', error);
        res.status(500).send('Error al cargar el formulario de edición');
    }
});

// Ruta para procesar la edición del costo
router.post('/costs/edit/:id', isAuthenticated, async (req, res) => {
    const { codigoCT, descCT, tamanoCT, montoCT, noArtiCT, factorCT } = req.body;

    try {
        await Cost.findByIdAndUpdate(req.params.id, {
            codigoCT,
            descCT,
            tamanoCT,
            montoCT,
            noArtiCT,
            factorCT
        });
        res.redirect('/costs');
    } catch (error) {
        console.error('Error updating cost:', error);
        res.status(500).send('Error al actualizar el costo');
    }
});

// Ruta para mostrar el formulario de creación de nuevo costo
router.get('/costs/add', isAuthenticated, (req, res) => {
    res.render('costs/add-cost');
});

// Ruta para procesar la creación del nuevo costo
router.post('/costs/add', isAuthenticated, async (req, res) => {
    const { codigoCT, descCT, tamanoCT, montoCT, noArtiCT, factorCT } = req.body;
    try {
        const newCost = new Cost({ codigoCT, descCT, tamanoCT, montoCT, noArtiCT, factorCT });
        await newCost.save();
        res.redirect('/costs');
    } catch (error) {
        console.error('Error al guardar el nuevo costo:', error);
        res.status(500).send('Error al guardar el nuevo costo');
    }
});

module.exports = router;
