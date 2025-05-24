const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const methodOverride = require('method-override');
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const passport = require('passport');
const handlebarsHelpers = require('./helpers/handlebars-helpers'); // Helpers personalizados

// Initializations
const app = express();
require('./database');
require('./config/passport');

// ✅ Static files (debe estar antes de las rutas)
app.use(express.static(path.join(__dirname, 'public')));

// Settings
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));

// Handlebars engine
app.engine('.hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    helpers: {
        ...handlebarsHelpers,
        formatDate: function(date) {
            if (!date) return '';
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        eq: function (a, b) {
            return a === b;
        },
        json: function (context) {
            return JSON.stringify(context);
        }
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
}));
app.set('view engine', '.hbs');

// Middlewares
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

// Global variables
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
app.use('/api', require('./routes/api'));
app.use(require('./routes/calculatorTres'));
app.use('/api/quotation-costs', require('./routes/quotationCostDetail'));
app.use('/pdf', require('./routes/exportaPDF'));

// Server start
app.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});
