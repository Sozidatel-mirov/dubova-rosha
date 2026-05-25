const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const { sequelize } = require('./models');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'sanatorium-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user and error messages available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.error = req.query.error || null;
    res.locals.success = req.query.success || null;
    res.locals.message = req.query.message || null;
    next();
});

// Routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
const servicesRoutes = require('./routes/services');
const roomsRoutes = require('./routes/rooms');
const galleryRoutes = require('./routes/gallery');
const adminRoutes = require('./routes/admin');
const adminServicesRoutes = require('./routes/adminServices');
const adminDoctorsRoutes = require('./routes/adminDoctors');
const adminGalleryRoutes = require('./routes/adminGallery');
const adminRoomsRoutes = require('./routes/adminRooms');
const adminDashboardRoutes = require('./routes/adminDashboard');  // Убедитесь что файл существует
const adminBookingsRoutes = require('./routes/adminBookings');
const doctorRoutes = require('./routes/doctor');
const adminReportRoutes = require('./routes/adminReport');
const aiChatRoutes = require('./routes/aiChat');
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/booking', bookingRoutes);
app.use('/services', servicesRoutes);
app.use('/rooms', roomsRoutes);
app.use('/gallery', galleryRoutes);
app.use('/admin', adminRoutes);
app.use('/admin', adminServicesRoutes);
app.use('/admin', adminDoctorsRoutes);
app.use('/admin', adminGalleryRoutes);
app.use('/admin', adminRoomsRoutes);
app.use('/admin', adminDashboardRoutes);
app.use('/admin', adminBookingsRoutes);
app.use('/doctor', doctorRoutes);
app.use('/admin', adminReportRoutes);
app.use('/api/ai', aiChatRoutes);

sequelize.sync()
    .then(async () => {
        console.log('Database connected');
        
        const { User } = require('./models');
        const userCount = await User.count();
        console.log(`Users in database: ${userCount}`);
        
        app.listen(5556, `0.0.0.0`,() => {
            console.log(`Server is running on http://localhost:5556`);
        });
    })
    .catch(err => {
        console.error('Database connection error:', err);
    });