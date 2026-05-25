const express = require('express');
const router = express.Router();
const { Booking } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Подтверждение бронирования
router.post('/booking/confirm/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        
        if (!booking) {
            return res.redirect('/profile?error=Бронирование не найдено');
        }
        
        booking.status = 'confirmed';
        await booking.save();
        
        console.log(`Booking ${booking.id} confirmed by admin`);
        res.redirect('/profile');  // Без сообщения
        
    } catch (error) {
        console.error(error);
        res.redirect('/profile?error=Ошибка при подтверждении бронирования');
    }
});

// Отклонение бронирования
router.post('/booking/reject/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        
        if (!booking) {
            return res.redirect('/profile?error=Бронирование не найдено');
        }
        
        booking.status = 'cancelled';
        await booking.save();
        
        console.log(`Booking ${booking.id} rejected by admin`);
        res.redirect('/profile');  // Без сообщения
        
    } catch (error) {
        console.error(error);
        res.redirect('/profile?error=Ошибка при отклонении бронирования');
    }
});

// Завершение бронирования
router.post('/booking/complete/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        
        if (!booking) {
            return res.redirect('/profile?error=Бронирование не найдено');
        }
        
        booking.status = 'completed';
        await booking.save();
        
        console.log(`Booking ${booking.id} completed by admin`);
        res.redirect('/profile');  // Без сообщения
        
    } catch (error) {
        console.error(error);
        res.redirect('/profile?error=Ошибка при завершении бронирования');
    }
});

module.exports = router;