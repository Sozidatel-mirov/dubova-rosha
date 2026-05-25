const express = require('express');
const router = express.Router();
const { Booking, User, Doctor, Service } = require('../models');
const { isAuthenticated, isDoctor } = require('../middleware/auth');
const { Op } = require('sequelize');

// Страница доктора (личный кабинет)
router.get('/dashboard', isAuthenticated, isDoctor, async (req, res) => {
    try {
        console.log('=== DOCTOR DASHBOARD ===');
        console.log('Session user:', JSON.stringify(req.session.user, null, 2));
        
        const doctorUser = req.session.user;
        
        // Проверяем, есть ли doctorId в сессии
        if (!doctorUser.doctorId) {
            console.log('ERROR: doctorId not found in session');
            
            // Пытаемся найти пользователя в БД и получить doctorId
            const userFromDb = await User.findByPk(doctorUser.id);
            console.log('User from DB:', userFromDb ? userFromDb.toJSON() : 'Not found');
            
            if (userFromDb && userFromDb.doctorId) {
                // Обновляем сессию
                req.session.user.doctorId = userFromDb.doctorId;
                doctorUser.doctorId = userFromDb.doctorId;
                console.log('Updated session with doctorId:', userFromDb.doctorId);
            } else {
                return res.redirect('/profile?error=Профиль врача не найден. Обратитесь к администратору.');
            }
        }
        
        // Находим запись врача
        const doctor = await Doctor.findByPk(doctorUser.doctorId);
        console.log('Found doctor:', doctor ? doctor.toJSON() : 'NOT FOUND');
        
        if (!doctor) {
            return res.redirect('/profile?error=Профиль врача не найден. Обратитесь к администратору.');
        }
        
        // Находим услуги этого врача
        const doctorServices = await Service.findAll({
            where: { doctorId: doctor.id }
        });
        console.log('Doctor services:', doctorServices.length);
        
        const serviceIds = doctorServices.map(s => s.id);
        
        // Находим все бронирования
        const bookings = await Booking.findAll({
            where: {
                status: {
                    [Op.in]: ['confirmed', 'pending']
                }
            },
            include: ['User', 'Room']
        });
        
        // Фильтруем бронирования по услугам врача
        const patients = [];
        for (const booking of bookings) {
            if (booking.selectedServices) {
                const services = JSON.parse(booking.selectedServices);
                const hasDoctorService = services.some(s => serviceIds.includes(s.id));
                if (hasDoctorService) {
                    patients.push({
                        bookingId: booking.id,
                        patient: booking.User,
                        room: booking.Room,
                        services: services.filter(s => serviceIds.includes(s.id)),
                        checkIn: booking.checkIn,
                        checkOut: booking.checkOut,
                        status: booking.status,
                        notes: booking.notes
                    });
                }
            }
        }
        
        console.log('Patients found:', patients.length);
        
        res.render('doctor/dashboard', {
            title: 'Панель врача',
            user: req.session.user,
            doctor: doctor,
            patients: patients,
            doctorServices: doctorServices
        });
    } catch (error) {
        console.error('Doctor dashboard error:', error);
        res.redirect('/profile?error=Ошибка загрузки панели врача: ' + error.message);
    }
});

// Подтверждение записи пациента
router.post('/confirm-appointment/:bookingId', isAuthenticated, isDoctor, async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.bookingId);
        if (!booking) {
            return res.redirect('/doctor/dashboard?error=Запись не найдена');
        }
        
        booking.status = 'confirmed';
        await booking.save();
        
        res.redirect('/doctor/dashboard?success=Запись подтверждена');
    } catch (error) {
        console.error(error);
        res.redirect('/doctor/dashboard?error=Ошибка при подтверждении');
    }
});

// Отмена записи пациента
router.post('/cancel-appointment/:bookingId', isAuthenticated, isDoctor, async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.bookingId);
        if (!booking) {
            return res.redirect('/doctor/dashboard?error=Запись не найдена');
        }
        
        booking.status = 'cancelled';
        await booking.save();
        
        res.redirect('/doctor/dashboard?success=Запись отменена');
    } catch (error) {
        console.error(error);
        res.redirect('/doctor/dashboard?error=Ошибка при отмене');
    }
});

module.exports = router;