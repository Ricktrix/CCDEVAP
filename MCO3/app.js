/* =============================================
     Polaris Airlines - App
     app.js

     This holds the Express app config (session, view engine, routes) but
     does NOT connect to the database or start listening - that's server.js.
     Splitting it this way lets tests import the app directly without
     needing a real MongoDB connection or an open port.
     ============================================= */

const express = require('express');
const session = require('express-session');
const path = require('path');
const { engine } = require('express-handlebars');

/* ── Route modules ── */
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const flightRoutes = require('./routes/flightRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const auditRoutes = require('./routes/auditRoutes');

/* ── Models (kept for the page routes that render data directly) ── */
const User = require('./models/User');
const Flight = require('./models/Flight');

/* ── Middleware ── */
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { requireLoginPage, requireAdminPage } = require('./middlewares/authMiddleware');

/* ── Constants ── */
// Bug fix: the original hardcoded both the session secret and a live
// MongoDB Atlas connection string (including a real username/password)
// directly in this file. Both now come from environment variables - see
// .env.example. If this project was ever pushed with the old hardcoded
// credentials, rotate that database password.
const SESSION_SECRET = process.env.SESSION_SECRET || 'polaris_session_secret_dev';

/* ── App ── */
const app = express();

/* ── Body parsing ── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Session ── */
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, /* set true in production with HTTPS */
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 /* 24 hours */
    }
}));

/* ── Handlebars engine ── */
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
        /* Equality check */
        eq: (a, b) => a === b,
        times: function (n, block) {
            // If used as an inline helper tag, block.fn won't exist. Just return the number or empty string.
            if (!block || typeof block.fn !== 'function') {
                return n !== undefined ? n : '';
            }
            // If used as a block helper loop ({{#times n}}), execute the loop iteration
            let accum = '';
            for (let i = 0; i < n; ++i) {
                accum += block.fn(i);
            }
            return accum;
        },
        /* Ternary shorthand */
        ternary: (cond, a, b) => cond ? a : b,
        /* Format date */
        formatDate: (d) => d ? new Date(d).toLocaleDateString('en-PH',
            { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        /* Format datetime */
        formatDateTime: (d) => d ? new Date(d).toLocaleString('en-PH',
            { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A',
        /* Compute flight duration string from two Date fields */
        flightDuration: (dep, arr) => {
            if (!dep || !arr) return 'N/A';
            const mins = Math.round((new Date(arr) - new Date(dep)) / 60000);
            return `${Math.floor(mins / 60)}h ${mins % 60}m`;
        },
        /* Format time only */
        formatTime: (d) => d ? new Date(d).toLocaleTimeString('en-PH',
            { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        /* Low-seats warning */
        lowSeats: (n) => n <= 10,
        /* First initial for avatar */
        firstInitial: (s) => {
            // If it's undefined, null, or false, return a placeholder
            if (!s) return '?';
            // Handle if an entire object or user record was passed by accident instead of a name string
            if (typeof s === 'object') {
                const nameStr = s.username || s.name || s.firstName || '';
                return nameStr ? nameStr.charAt(0).toUpperCase() : '?';
            }
            // Force the item to a string value just in case it's a number, then grab the first letter
            const stringValue = String(s).trim();
            return stringValue.length > 0 ? stringValue.charAt(0).toUpperCase() : '?';
        },
        /* Member since */
        memberSince: (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }) : 'N/A',
        /* Tax calculation (12%) */
        taxAmount: (price) => price ? (price * 0.12).toFixed(2) : '0.00',
        /* Total including tax */
        totalPrice: (price) => price ? (price * 1.12).toFixed(2) : '0.00'
    }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

/* ── Static files ── */
app.use('/static', express.static(path.join(__dirname, 'public')));

/* ────────────────────────────────────────────
      SESSION CONTEXT HELPER
      Attaches user + active-page flags to every
      res.locals so every HBS template can read them.
      ──────────────────────────────────────────── */
app.use(function (req, res, next) {
    res.locals.user = req.session.user || null;
    res.locals.isAdmin = req.session.user?.role === 'admin';
    next();
});

/* ────────────────────────────────────────────
      PAGE ROUTES   (render HBS views)
      These are separate from the /api/* JSON routes.
      ──────────────────────────────────────────── */

/* Home */
app.get('/', function (req, res) {
    return res.render('index', {
        title: 'Home',
        isHome: true
    });
});

/* Login */
app.get('/login', function (req, res) {
    if (req.session.user) {
        return res.redirect(req.session.user.role === 'admin' ? '/admin/flights' : '/flights/search');
    }
    return res.render('passenger/login', {
        title: 'Login',
        isLogin: true,
        layout: 'main'
    });
});

/* Register */
app.get('/register', function (req, res) {
    if (req.session.user) return res.redirect('/');
    return res.render('passenger/register', {
        title: 'Register',
        layout: 'main'
    });
});

/* Flight search */
app.get('/flights/search', function (req, res) {
    return res.render('passenger/search', {
        title: 'Search Flights',
        isSearch: true,
        searchParams: {
            origin: req.query.origin || '',
            destination: req.query.destination || '',
            departureDate: req.query.departureDate || ''
        }
    });
});

/* Flight details + booking form */
app.get('/flights/:id/details', requireLoginPage, async function (req, res) {
    try {
        const flight = await Flight.findById(req.params.id).lean();
        if (!flight) {
            return res.status(404).render('passenger/search', {
                title: 'Flight Not Found',
                isSearch: true
            });
        }

        const dep = new Date(flight.departureDateTime);
        const arr = new Date(flight.arrivalDateTime);
        const durMins = Math.round((arr - dep) / 60000);
        const duration = `${Math.floor(durMins / 60)}h ${durMins % 60}m`;
        const baseFare = flight.ticketPrice;
        const tax = Math.round(baseFare * 0.12 * 100) / 100;

        return res.render('passenger/flight-details', {
            title: `Book ${flight.flightNumber}`,
            flight,
            depTime: dep.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
            arrTime: arr.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
            depDate: dep.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
            arrDate: arr.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
            duration,
            taxAmount: tax.toFixed(2),
            totalPrice: (baseFare + tax).toFixed(2),
            // Bug fix: Flight has no `seatsAvailable` typo issue here specifically,
            // but the original referenced it correctly already - kept as-is.
            lowSeats: flight.seatsAvailable <= 10
        });
    } catch (err) {
        console.error('Error rendering flight details:', err);
        return res.redirect('/flights/search');
    }
});

/* My Reservations */
app.get('/reservations', requireLoginPage, function (req, res) {
    return res.render('passenger/reservations', {
        title: 'My Reservations',
        isReservations: true
    });
});

/* Profile */
app.get('/profile', requireLoginPage, async function (req, res) {
    try {
        const user = await User.findById(req.session.user.id).select('-password').lean();
        if (!user) return res.redirect('/login');
        return res.render('passenger/profile', {
            title: 'My Profile',
            user,
            firstInitial: user.firstName.charAt(0).toUpperCase(),
            memberSince: new Date(user.createdAt).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
        });
    } catch (err) {
        console.error('Error rendering profile:', err);
        return res.redirect('/');
    }
});

/* Admin — Flight Management */
app.get('/admin/flights', requireAdminPage, function (req, res) {
    return res.render('admin/flights', {
        title: 'Manage Flights',
        isAdminFlights: true
    });
});

/* Admin — All Reservations */
app.get('/admin/reservations', requireAdminPage, function (req, res) {
    return res.render('admin/reservations', {
        title: 'All Reservations',
        isAdminReservations: true
    });
});

/* Admin — Audit Log Viewer (new for Milestone 3) */
app.get('/admin/audit-logs', requireAdminPage, function (req, res) {
    return res.render('admin/audit-logs', {
        title: 'Audit Trail',
        isAdminAuditLogs: true
    });
});

/* ────────────────────────────────────────────
      API ROUTES     (return JSON)
      ──────────────────────────────────────────── */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/audit-logs', auditRoutes);

/* ── Error middleware (must be last) ── */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
