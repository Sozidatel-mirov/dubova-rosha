const express = require('express');
const router = express.Router();
const { Booking, User, Room } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Страница управления бронированиями
router.get('/bookings', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            include: ['User', 'Room'],
            order: [['createdAt', 'DESC']]
        });
        
        const stats = {
            total: bookings.length,
            pending: bookings.filter(b => b.status === 'pending').length,
            confirmed: bookings.filter(b => b.status === 'confirmed').length,
            cancelled: bookings.filter(b => b.status === 'cancelled').length
        };
        
        res.render('admin/bookings', {
            title: 'Управление бронированиями',
            user: req.session.user,
            bookings: bookings,
            stats: stats
        });
    } catch (error) {
        console.error(error);
        res.redirect('/admin/dashboard?error=Ошибка загрузки бронирований');
    }
});

// Подтверждение бронирования
router.post('/bookings/confirm/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        
        if (!booking) {
            return res.redirect('/admin/bookings?error=Бронирование не найдено');
        }
        
        booking.status = 'confirmed';
        await booking.save();
        
        res.redirect('/admin/bookings?success=Бронирование #' + booking.id + ' подтверждено');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/bookings?error=Ошибка при подтверждении');
    }
});

// Отклонение бронирования
router.post('/bookings/reject/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        
        if (!booking) {
            return res.redirect('/admin/bookings?error=Бронирование не найдено');
        }
        
        booking.status = 'cancelled';
        await booking.save();
        
        res.redirect('/admin/bookings?success=Бронирование #' + booking.id + ' отклонено');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/bookings?error=Ошибка при отклонении');
    }
});

// Удаление бронирования (для любого статуса)
router.post('/bookings/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        
        if (!booking) {
            return res.redirect('/admin/bookings?error=Бронирование не найдено');
        }
        
        const bookingId = booking.id;
        await booking.destroy();
        
        res.redirect('/admin/bookings?success=Бронирование #' + bookingId + ' удалено');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/bookings?error=Ошибка при удалении');
    }
});

module.exports = router;