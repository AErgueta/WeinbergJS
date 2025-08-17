// routes/users.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const { isAuthenticated } = require('../helpers/auth');

// -------------------- LOGIN --------------------
router.get('/users/signin', (req, res) => {
    res.render('users/signin');
});

router.post('/users/signin', passport.authenticate('local', {
    successRedirect: '/customers',
    failureRedirect: '/users/signin',
    failureFlash: true
}));

// -------------------- SIGNUP --------------------
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
        req.flash('error_msg', 'El correo ya se encuentra registrado');
        return res.redirect('/users/signup');
    }

    const newUser = new User({ name, email, password, role });
    newUser.password = await newUser.encryptPassword(password);
    await newUser.save();
    req.flash('success_msg', 'Usuario registrado');
    res.redirect('/users/signin');
});

// -------------------- LOGOUT --------------------
router.get('/users/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/');
    });
});

// -------------------- CAMBIO DE CONTRASEÑA --------------------
// Mostrar formulario
router.get('/users/change-password', isAuthenticated, (req, res) => {
    res.render('users/change-password');
});

// Procesar cambio
router.post('/users/change-password', isAuthenticated, async (req, res) => {
    const { current_password, new_password, confirm_password } = req.body;
    const errors = [];

    try {
        const user = await User.findById(req.user.id);

        // Validar contraseña actual
        const isMatch = await user.matchPassword(current_password);
        if (!isMatch) {
            errors.push({ text: 'La contraseña actual es incorrecta' });
        }

        // Validar coincidencia de nueva contraseña
        if (new_password !== confirm_password) {
            errors.push({ text: 'Las nuevas contraseñas no coinciden' });
        }

        // Validar longitud mínima
        if (new_password.length < 4) {
            errors.push({ text: 'La nueva contraseña debe tener al menos 4 caracteres' });
        }

        // Validar que no sea igual a la actual
        const isSameAsOld = await user.matchPassword(new_password);
        if (isSameAsOld) {
            errors.push({ text: 'La nueva contraseña no puede ser igual a la actual' });
        }

        if (errors.length > 0) {
            return res.render('users/change-password', { 
                errors, 
                current_password, 
                new_password, 
                confirm_password 
            });
        }

        // Guardar nueva contraseña encriptada
        user.password = await user.encryptPassword(new_password);
        await user.save();

        req.flash('success_msg', 'Contraseña actualizada correctamente');
        res.redirect('/customers');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error al cambiar la contraseña');
        res.redirect('/users/change-password');
    }
});

module.exports = router;
