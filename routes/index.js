const express = require('express');
const router = express.Router();
const { Booking, Room, Service } = require('../models');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const rooms = await Room.findAll({ limit: 3 });
        const services = await Service.findAll({ limit: 4 });
        res.render('index', { 
            title: 'Санаторий «Здоровье»',
            rooms,
            services
        });
    } catch (error) {
        console.error(error);
        res.render('index', { title: 'Санаторий «Здоровье»', rooms: [], services: [] });
    }
});

router.get('/about', (req, res) => {
    res.render('about', { title: 'О нас' });
});

router.get('/contacts', (req, res) => {
    res.render('contacts', { title: 'Контакты' });
});

router.get('/bookings', (req, res) => {
    res.render('booking', { title: 'Бронирование' });
});

router.get('/doctors', async (req, res) => {
    try {
        const { Doctor } = require('../models');
        const doctors = await Doctor.findAll({
            order: [['order', 'ASC'], ['name', 'ASC']]
        });
        res.render('doctors', { 
            title: 'Наши врачи',
            doctors: doctors || []
        });
    } catch (error) {
        console.error('Error loading doctors:', error);
        res.render('doctors', { 
            title: 'Наши врачи',
            doctors: []
        });
    }
});

router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/profile');
    }
    res.render('login', { title: 'Вход' });
});

router.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/profile');
    }
    res.render('register', { title: 'Регистрация' });
});

router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            where: { userId: req.session.user.id },
            include: ['Room']
        });
        
        let allBookings = [];
        
        if (req.session.user.role === 'admin') {
            allBookings = await Booking.findAll({
                include: ['Room', 'User'],
                order: [['createdAt', 'DESC']]
            });
        }
        
        res.render('profile', { 
            title: 'Личный кабинет',
            user: req.session.user,
            bookings: bookings,
            allBookings: allBookings
        });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
});
module.exports = router;