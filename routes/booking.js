const express = require('express');
const router = express.Router();
const { Booking, Room, Service, Doctor } = require('../models');
const { isAuthenticated } = require('../middleware/auth');
const { Op } = require('sequelize');

// API проверки доступности номера
router.post('/api/check-availability', async (req, res) => {
    try {
        const { roomId, checkIn, checkOut } = req.body;
        console.log('Checking availability:', { roomId, checkIn, checkOut });
        
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        
        const existingBookings = await Booking.findAll({
            where: {
                roomId: parseInt(roomId),
                status: {
                    [Op.in]: ['confirmed', 'pending']
                },
                [Op.or]: [
                    {
                        checkIn: {
                            [Op.lt]: endDate
                        },
                        checkOut: {
                            [Op.gt]: startDate
                        }
                    }
                ]
            }
        });
        
        console.log('Existing bookings found:', existingBookings.length);
        res.json({ available: existingBookings.length === 0 });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.json({ available: false, error: true });
    }
});

// API получения занятых дат для номера
router.post('/api/booked-dates', async (req, res) => {
    try {
        const { roomId } = req.body;
        console.log('Getting booked dates for room:', roomId);
        
        const bookings = await Booking.findAll({
            where: {
                roomId: parseInt(roomId),
                status: {
                    [Op.in]: ['confirmed', 'pending']
                }
            }
        });
        
        console.log('Found bookings:', bookings.length);
        
        const bookedDates = [];
        
        bookings.forEach(booking => {
            const start = new Date(booking.checkIn);
            const end = new Date(booking.checkOut);
            let current = new Date(start);
            
            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                if (!bookedDates.includes(dateStr)) {
                    bookedDates.push(dateStr);
                }
                current.setDate(current.getDate() + 1);
            }
        });
        
        console.log('Booked dates:', bookedDates);
        res.json({ bookedDates: bookedDates });
    } catch (error) {
        console.error('Error getting booked dates:', error);
        res.json({ bookedDates: [] });
    }
});

// Страница бронирования (GET маршрут)
router.get('/:roomId', isAuthenticated, async (req, res) => {
    try {
        const roomId = req.params.roomId;
        
        const room = await Room.findByPk(roomId);
        if (!room) {
            return res.redirect('/rooms?error=Номер не найден');
        }
        
        // Проверяем, доступен ли номер для бронирования
        if (!room.isAvailable) {
            return res.redirect('/rooms?error=Этот номер временно недоступен для бронирования');
        }
        
        // Получаем все услуги с информацией о врачах
        const allServices = await Service.findAll({
            include: [{
                model: Doctor,
                as: 'Doctor'
            }],
            order: [['category', 'ASC'], ['name', 'ASC']]
        });
        
        const medicalServices = allServices.filter(s => s.category === 'medical');
        const wellnessServices = allServices.filter(s => s.category === 'wellness');
        const spaServices = allServices.filter(s => s.category === 'spa');
        
        res.render('booking', {
            title: `Бронирование - ${room.name}`,
            room: room,
            medicalServices: medicalServices,
            wellnessServices: wellnessServices,
            spaServices: spaServices,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error in GET /booking/:roomId:', error);
        res.redirect('/rooms?error=Ошибка загрузки страницы бронирования');
    }
});

// Создание бронирования (POST маршрут)
router.post('/create', isAuthenticated, async (req, res) => {
    try {
        const { roomId, checkIn, checkOut, notes, selectedServices } = req.body;
        
        console.log('POST /booking/create:', { roomId, checkIn, checkOut, userId: req.session.user.id });
        
        const room = await Room.findByPk(roomId);
        if (!room) {
            return res.redirect('/rooms?error=Номер не найден');
        }
        
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        if (nights <= 0) {
            return res.redirect(`/booking/${roomId}?error=Некорректные даты бронирования`);
        }
        
        // Проверка занятости номера
        const existingBookings = await Booking.findAll({
            where: {
                roomId: parseInt(roomId),
                status: {
                    [Op.in]: ['confirmed', 'pending']
                },
                [Op.or]: [
                    {
                        checkIn: {
                            [Op.lt]: endDate
                        },
                        checkOut: {
                            [Op.gt]: startDate
                        }
                    }
                ]
            }
        });
        
        if (existingBookings.length > 0) {
            return res.redirect(`/booking/${roomId}?error=Номер занят на выбранные даты. Пожалуйста, выберите другие даты.`);
        }
        
        // Рассчитываем стоимость
        let totalPrice = room.price * nights;
        
        let selectedServicesArray = [];
        if (selectedServices) {
            selectedServicesArray = JSON.parse(selectedServices);
            for (const service of selectedServicesArray) {
                if (service.billingType === 'once') {
                    totalPrice += service.price;
                } else {
                    totalPrice += service.price * nights;
                }
            }
        }
        
        const booking = await Booking.create({
            userId: req.session.user.id,
            roomId: parseInt(roomId),
            checkIn: startDate,
            checkOut: endDate,
            guests: 1,
            totalPrice,
            notes: notes || '',
            status: 'pending',
            selectedServices: selectedServices || null
        });
        
        // Если есть выбранные услуги, создаём связи
        if (selectedServicesArray.length > 0) {
            const serviceIds = selectedServicesArray.map(s => s.id);
            await booking.addServices(serviceIds);
        }
        
        console.log('Booking created:', booking.id);
        
        res.redirect(`/profile?success=Бронирование #${booking.id} успешно создано! Ожидайте подтверждения.`);
        
    } catch (error) {
        console.error('Booking error:', error);
        const roomId = req.body.roomId;
        res.redirect(`/booking/${roomId}?error=Ошибка при создании бронирования`);
    }
});

// Отмена бронирования
router.post('/cancel/:id', isAuthenticated, async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        
        if (!booking) {
            return res.redirect('/profile?error=Бронирование не найдено');
        }
        
        if (booking.userId !== req.session.user.id && req.session.user.role !== 'admin') {
            return res.redirect('/profile?error=Нет прав для отмены этого бронирования');
        }
        
        booking.status = 'cancelled';
        await booking.save();
        
        if (req.session.user.role !== 'admin') {
            res.redirect('/profile?message=Бронирование отменено');
        } else {
            res.redirect('/profile');
        }
    } catch (error) {
        console.error(error);
        res.redirect('/profile?error=Ошибка при отмене бронирования');
    }
});

module.exports = router;
