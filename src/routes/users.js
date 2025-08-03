const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

router.get('/users/signin', (req, res) => {
    res.render('users/signin');
});

router.post('/users/signin', passport.authenticate('local', {
    successRedirect: '/customers',
    failureRedirect: '/users/signin',
    failureFlash: true
}));

router.get('/users/signup', (req, res) => {
    res.render('users/signup');
});

router.post('/users/signup', async (req, res) => {
    const { name, email, password, confirm_password, admin_password, role } = req.body;
    const errors = [];

    if (!name || name.trim().length === 0) {
        errors.push({ text: 'Por favor digite el nombre' });
    }
    if (password !== confirm_password) {
        errors.push({ text: 'Las contraseñas no coinciden' });
    }
    if (password.length < 4) {
        errors.push({ text: 'La contraseña debe contener más de 4 caracteres' });
    }
    if (!role || !['A', 'U'].includes(role)) {
        errors.push({ text: 'Debe seleccionar un tipo de usuario válido' });
    }

    // Validar contraseña del administrador
    const adminUser = await User.findOne({ email: 'administrador@numb-wb.com' }); 
    if (!adminUser) {
        errors.push({ text: 'No se encontró el usuario administrador.' });
    } else {
        const isAdminPasswordValid = await adminUser.matchPassword(admin_password || '');
        if (!isAdminPasswordValid) {
            errors.push({ text: 'Contraseña de administrador incorrecta' });
        }
    }

    if (errors.length > 0) {
        return res.render('users/signup', {
            errors, name, email, password, confirm_password, role
        });
    }

    // Validar si el correo ya existe
    const emailUser = await User.findOne({ email: email });
    if (emailUser) {
        req.flash('errors', 'El correo ya se encuentra registrado');
        return res.redirect('/users/signup');
    }

    const newUser = new User({ name, email, password, role });
    newUser.password = await newUser.encryptPassword(password);
    await newUser.save();
    req.flash('success_msg', 'Usuario registrado');
    res.redirect('/users/signin');
});

router.get('/users/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/');
    });
});

module.exports = router;
