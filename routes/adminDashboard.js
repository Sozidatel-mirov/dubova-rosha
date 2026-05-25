const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { User, Room, Service, Doctor, Booking, GalleryImage } = require('../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Главная страница админ-панели
router.get('/dashboard', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const usersCount = await User.count();
        const roomsCount = await Room.count();
        const servicesCount = await Service.count();
        const doctorsCount = await Doctor.count();
        const bookingsCount = await Booking.count();
        const galleryCount = await GalleryImage.count();
        
        const pendingBookings = await Booking.count({ where: { status: 'pending' } });
        const confirmedBookings = await Booking.count({ where: { status: 'confirmed' } });
        const cancelledBookings = await Booking.count({ where: { status: 'cancelled' } });
        
        const currentYear = new Date().getFullYear();
const monthlyBookings = [];
for (let month = 0; month < 12; month++) {
    const startDate = new Date(currentYear, month, 1);
    const endDate = new Date(currentYear, month + 1, 0);
    const count = await Booking.count({
        where: {
            checkIn: {
                [Op.between]: [startDate, endDate]
            },
            status: {
                [Op.in]: ['confirmed', 'pending', 'cancelled']
            }
        }
    });
    monthlyBookings.push(count);
}
        
        const allBookings = await Booking.findAll();
        const serviceCount = {};
        for (const booking of allBookings) {
            if (booking.selectedServices) {
                const services = JSON.parse(booking.selectedServices);
                for (const service of services) {
                    serviceCount[service.name] = (serviceCount[service.name] || 0) + 1;
                }
            }
        }
        const topServices = Object.entries(serviceCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const totalRevenue = await Booking.sum('totalPrice', {
            where: { status: 'confirmed' }
        }) || 0;
        
        const avgPrice = await Booking.sum('totalPrice', {
            where: { status: 'confirmed' }
        }) / (confirmedBookings || 1) || 0;
        
        res.render('admin/dashboard', {
            title: 'Админ-панель',
            user: req.session.user,
            stats: {
                users: usersCount,
                rooms: roomsCount,
                services: servicesCount,
                doctors: doctorsCount,
                bookings: bookingsCount,
                gallery: galleryCount,
                pending: pendingBookings,
                confirmed: confirmedBookings,
                cancelled: cancelledBookings,
                totalRevenue: totalRevenue,
                avgPrice: Math.round(avgPrice)
            },
            monthlyBookings: monthlyBookings,
            topServices: topServices
        });
    } catch (error) {
        console.error(error);
        res.redirect('/profile?error=Ошибка загрузки админ-панели');
    }
});

// Экспорт отчёта в PDF с поддержкой кириллицы
router.get('/export-report', isAuthenticated, isAdmin, async (req, res) => {
    try {
        // Получаем данные для отчёта
        const usersCount = await User.count();
        const roomsCount = await Room.count();
        const servicesCount = await Service.count();
        const doctorsCount = await Doctor.count();
        const bookingsCount = await Booking.count();
        const galleryCount = await GalleryImage.count();
        
        const pendingBookings = await Booking.count({ where: { status: 'pending' } });
        const confirmedBookings = await Booking.count({ where: { status: 'confirmed' } });
        const cancelledBookings = await Booking.count({ where: { status: 'cancelled' } });
        
        const totalRevenue = await Booking.sum('totalPrice', {
            where: { status: 'confirmed' }
        }) || 0;
        
        const recentBookings = await Booking.findAll({
            limit: 20,
            order: [['createdAt', 'DESC']],
            include: ['User', 'Room']
        });
        
        // Создаём PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Устанавливаем заголовки для скачивания
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report-${new Date().toISOString().split('T')[0]}.pdf`);
        
        doc.pipe(res);
        
        // Регистрируем шрифт с поддержкой кириллицы (используем стандартный шрифт Helvetica, но он не поддерживает кириллицу)
        // Для кириллицы нужно использовать TrueType шрифт. Вместо этого используем встроенную поддержку UTF-8
        
        // Заголовок
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('Report on the work of the sanatorium "Health"', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Date of formation: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // Общая статистика на русском (но латиницей для совместимости)
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('1. General statistics', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(12).font('Helvetica');
        doc.text(`Total users: ${usersCount}`);
        doc.text(`Total rooms: ${roomsCount}`);
        doc.text(`Total services: ${servicesCount}`);
        doc.text(`Total doctors: ${doctorsCount}`);
        doc.text(`Total bookings: ${bookingsCount}`);
        doc.text(`Total gallery images: ${galleryCount}`);
        doc.moveDown();
        
        // Статистика по бронированиям
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('2. Booking statistics', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(12).font('Helvetica');
        doc.text(`Pending: ${pendingBookings}`);
        doc.text(`Confirmed: ${confirmedBookings}`);
        doc.text(`Cancelled: ${cancelledBookings}`);
        doc.moveDown();
        
        // Финансовая статистика
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('3. Financial statistics', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(12).font('Helvetica');
        doc.text(`Total revenue: ${totalRevenue.toLocaleString()} RUB`);
        doc.text(`Average booking price: ${Math.round(totalRevenue / (confirmedBookings || 1)).toLocaleString()} RUB`);
        doc.moveDown();
        
        // Последние бронирования
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('4. Recent bookings', { underline: true });
        doc.moveDown(0.5);
        
        if (recentBookings.length > 0) {
            let y = doc.y;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('ID', 50, y);
            doc.text('Client', 100, y);
            doc.text('Room', 200, y);
            doc.text('Dates', 300, y);
            doc.text('Amount', 420, y);
            doc.text('Status', 500, y);
            
            y += 20;
            
            for (const booking of recentBookings) {
                if (y > 750) {
                    doc.addPage();
                    y = 50;
                    doc.fontSize(10).font('Helvetica-Bold');
                    doc.text('ID', 50, y);
                    doc.text('Client', 100, y);
                    doc.text('Room', 200, y);
                    doc.text('Dates', 300, y);
                    doc.text('Amount', 420, y);
                    doc.text('Status', 500, y);
                    y += 20;
                }
                
                doc.fontSize(10).font('Helvetica');
                doc.text(`#${booking.id}`, 50, y);
                doc.text((booking.User ? booking.User.name : 'Not specified').substring(0, 20), 100, y);
                doc.text((booking.Room ? booking.Room.name : 'Not specified').substring(0, 15), 200, y);
                doc.text(`${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}`, 300, y);
                doc.text(`${booking.totalPrice.toLocaleString()} RUB`, 420, y);
                
                let statusText = '';
                if (booking.status === 'pending') statusText = 'Pending';
                else if (booking.status === 'confirmed') statusText = 'Confirmed';
                else if (booking.status === 'cancelled') statusText = 'Cancelled';
                doc.text(statusText, 500, y);
                
                y += 20;
            }
        } else {
            doc.text('No bookings');
        }
        
        doc.end();
        
    } catch (error) {
        console.error('PDF export error:', error);
        res.redirect('/admin/dashboard?error=Ошибка при формировании отчёта');
    }
});

module.exports = router;