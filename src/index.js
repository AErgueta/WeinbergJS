const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars'); // Importar correctamente express-handlebars
const methodOverride = require('method-override');
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const passport = require('passport');
const handlebarsHelpers = require('./helpers/handlebars-helpers'); // Importar el archivo de helpers

// Initializations
const app = express();
require('./database');
require('./config/passport');

// Settings
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));

// Configuración del motor de plantillas de Handlebars
app.engine('.hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    helpers: {
        ...handlebarsHelpers, // Registrar los helpers adicionales
        formatDate: function(date) {
            if (!date) return '';
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        // Helper para comparar valores
        eq: function (a, b) {
            return a === b;
        },
        json: function (context) {
            return JSON.stringify(context);
        }
    },
    // Agrega esta opción para permitir acceso a propiedades no directas
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
}));
app.set('view engine', '.hbs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(session({
    secret: 'mysecretapp',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global Variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('errors');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

// Routes
app.use(require('./routes/index'));
app.use(require('./routes/quotes'));
app.use(require('./routes/users'));
app.use(require('./routes/customers'));
app.use(require('./routes/quotation'));
app.use(require('./routes/calculator'));
app.use(require('./routes/costs'));

const calculatorDosRoutes = require('./routes/calculatorDos'); // Importa las rutas de calculatorDos

// Usa las rutas de calculatorDos
app.use('/', calculatorDosRoutes);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Server is listening
app.listen(app.get('port'), () => {
    console.log('Server on port ', app.get('port'));
});
