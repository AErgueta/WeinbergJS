const express = require('express');
const router = express.Router();

router.get('/quotes/add', (req, res) => {
    res.render('quotes/new-client');
});

router.post('/quotes/new-client', (req, res) => {
    const { alias, nombre, nombreC, eMail, telf } = req.body;
    const errors = [];
    if(!alias) {
        errors.push({text: 'Por favor inserte el Alias'});
    }
    if(!nombre) {
        errors.push({text: 'Por favor digite el nombre del cliente'});
    }
    if(!nombreC) {
        errors.push({text: 'Por favor digite el nombre del contacto'});
    }
    if(!eMail) {
        errors.push({text: 'Por favor digite el eMail'});
    }
    if(!telf) {
        errors.push({text: 'Por favor digite el número de teléfono'});
    }
    if(errors.length > 0) {
        res.render('quotes/new-client', {
            errors, 
            alias,
            nombre, 
            nombreC,
            eMail,
            telf
        });
    } else {
        res.send('Ok');
    }
});

router.get('/quotes', (req, res) => {
    res.send('Clientes de la Base de Datos');
});

module.exports = router;