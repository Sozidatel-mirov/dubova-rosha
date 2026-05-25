const express = require('express');
const router = express.Router();
const { Booking, User, Room, Service, Doctor } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { Op, Sequelize } = require('sequelize');

// Страница аналитики
router.get('/analytics', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        
        // Определяем диапазон дат
        let dateFilter = {};
        const now = new Date();
        
        if (period === 'week') {
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            dateFilter = { [Op.gte]: weekAgo };
        } else if (period === 'month') {
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            dateFilter = { [Op.gte]: monthAgo };
        } else if (period === 'year') {
            const yearAgo = new Date(now);
            yearAgo.setFullYear(now.getFullYear() - 1);
            dateFilter = { [Op.gte]: yearAgo };
        }
        
        // 1. Общая статистика
        const totalUsers = await User.count();
        const totalRooms = await Room.count();
        const totalServices = await Service.count();
        const totalDoctors = await Doctor.count();
        
        // 2. Статистика по бронированиям
        const totalBookings = await Booking.count();
        const pendingBookings = await Booking.count({ where: { status: 'pending' } });
        const confirmedBookings = await Booking.count({ where: { status: 'confirmed' } });
        const cancelledBookings = await Booking.count({ where: { status: 'cancelled' } });
        
        // 3. Финансовая статистика
        const confirmedBookingsList = await Booking.findAll({
            where: { status: 'confirmed' }
        });
        
        const totalRevenue = confirmedBookingsList.reduce((sum, b) => sum + b.totalPrice, 0);
        
        // Доход за выбранный период
        const periodBookings = await Booking.findAll({
            where: {
                status: 'confirmed',
                createdAt: dateFilter
            }
        });
        const periodRevenue = periodBookings.reduce((sum, b) => sum + b.totalPrice, 0);
        
        // 4. Статистика по месяцам (для графика)
        const monthlyStats = await Booking.findAll({
            where: { status: 'confirmed' },
            attributes: [
                [Sequelize.fn('strftime', '%Y-%m', Sequelize.col('createdAt')), 'month'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('totalPrice')), 'revenue']
            ],
            group: [Sequelize.fn('strftime', '%Y-%m', Sequelize.col('createdAt'))],
            order: [[Sequelize.fn('strftime', '%Y-%m', Sequelize.col('createdAt')), 'ASC']],
            limit: 12
        });
        
        // 5. Популярные номера
        const popularRooms = await Booking.findAll({
            where: { status: 'confirmed' },
            attributes: [
                'roomId',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'bookingCount']
            ],
            include: ['Room'],
            group: ['roomId', 'Room.id'],
            order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
            limit: 5
        });
        
        // 6. Популярные услуги
        const allBookings = await Booking.findAll({
            where: { status: 'confirmed' }
        });
        
        const serviceCount = {};
        for (const booking of allBookings) {
            if (booking.selectedServices) {
                const services = JSON.parse(booking.selectedServices);
                for (const service of services) {
                    serviceCount[service.name] = (serviceCount[service.name] || 0) + 1;
                }
            }
        }
        
        const popularServices = Object.entries(serviceCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        
        // 7. Активность пользователей
        const activeUsers = await User.findAll({
            include: [{
                model: Booking,
                where: { status: 'confirmed' },
                required: true
            }],
            attributes: [
                'id', 'name', 'email',
                [Sequelize.fn('COUNT', Sequelize.col('Bookings.id')), 'bookingCount']
            ],
            group: ['User.id'],
            order: [[Sequelize.fn('COUNT', Sequelize.col('Bookings.id')), 'DESC']],
            limit: 5
        });
        
        // 8. Загрузка номеров (средняя заполняемость)
        const roomsWithBookings = await Room.findAll({
            include: [{
                model: Booking,
                where: { status: 'confirmed' },
                required: false
            }],
            attributes: [
                'id', 'name', 'capacity',
                [Sequelize.fn('COUNT', Sequelize.col('Bookings.id')), 'bookingCount']
            ],
            group: ['Room.id']
        });
        
        res.render('admin/analytics', {
            title: 'Аналитика',
            user: req.session.user,
            stats: {
                totalUsers,
                totalRooms,
                totalServices,
                totalDoctors,
                totalBookings,
                pendingBookings,
                confirmedBookings,
                cancelledBookings,
                totalRevenue,
                periodRevenue
            },
            monthlyStats: monthlyStats || [],
            popularRooms: popularRooms || [],
            popularServices: popularServices || [],
            activeUsers: activeUsers || [],
            roomsWithBookings: roomsWithBookings || [],
            period
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.redirect('/admin/dashboard?error=Ошибка загрузки аналитики');
    }
});

module.exports = router;