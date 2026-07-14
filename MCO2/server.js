const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
const path = require('path');
const { engine } = require('express-handlebars');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const flightRoutes = require('./routes/flightRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const User = require('./models/User');
const City = require('./models/City');
const Country = require('./models/Country');
const Flight = require('./models/Flight');

const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const HTTP_STATUS = { OK: 200 };

/* palagay dito yung connection natin to the MongoDB atlas
const MONGODB_URI = ;
*/
const SESSION_SECRET = 'skyjet_session_secret';

// Connection to the database
const connectDatabase = async function() {
    try {
        await mongoose.connection(MONGODB_URI);
        console.log('MongoDB Atlas connected successfully.');
    }
    catch (error) {
        console.error('MongoDB Atlas connection failed.');
        console.error(error);
        process.exit(1);
    }
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// express sessions
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// handlebars
app.engine('handlebars', engine({ defaultLayout: false }));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views') );

// configures static files
app.use('/static', express.static(path.join(__join, 'public')) );

// Root route
app.get('/', function(req, res){
    return res.status(HTTP_STATUS.OK).json({ success: true, message: 'SkyJet Airlines Online Ticketing System API is running' });
});

// application routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/bookings', bookingRoutes);

// error middleware
app.use(notFound);
app.use(errorHandler);

connectDatabase();

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));