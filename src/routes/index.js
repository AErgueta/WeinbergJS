const express = require('express');
const res = require('express/lib/response');
const nodemon = require('nodemon');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/about', (req, res) => {
    res.render('about');
});

module.exports = router;