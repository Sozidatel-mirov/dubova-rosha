const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { User, Room, Service, Doctor, Booking, GalleryImage } = require('../models');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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
        
        // Создаём PDF с русским шрифтом
        // Путь к шрифту с поддержкой кириллицы
        let fontPath = path.join(__dirname, '../fonts/arial.ttf');
        
        // Если Arial не найден, пробуем другой шрифт
        if (!fs.existsSync(fontPath)) {
            // Попробуем использовать встроенный шрифт (но он не поддерживает русский)
            fontPath = null;
        }
        
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Если есть русский шрифт - регистрируем его
        if (fontPath && fs.existsSync(fontPath)) {
            doc.registerFont('RussianFont', fontPath);
            doc.font('RussianFont');
        } else {
            console.log('Russian font not found, using default font (Russian text may not display correctly)');
        }
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report-${new Date().toISOString().split('T')[0]}.pdf`);
        
        doc.pipe(res);
        
        // Заголовок (на русском)
        doc.fontSize(18)
           .font(fontPath ? 'RussianFont' : 'Helvetica-Bold')
           .text('Отчёт о работе санатория "Здоровье"', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(10)
           .font(fontPath ? 'RussianFont' : 'Helvetica')
           .text(`Дата формирования: ${new Date().toLocaleString('ru-RU')}`, { align: 'center' });
        doc.moveDown(2);
        
        // Общая статистика
        doc.fontSize(14)
           .font(fontPath ? 'RussianFont' : 'Helvetica-Bold')
           .text('1. Общая статистика', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(10)
           .font(fontPath ? 'RussianFont' : 'Helvetica');
        doc.text(`Всего пользователей: ${usersCount}`);
        doc.text(`Всего номеров: ${roomsCount}`);
        doc.text(`Всего услуг: ${servicesCount}`);
        doc.text(`Всего врачей: ${doctorsCount}`);
        doc.text(`Всего бронирований: ${bookingsCount}`);
        doc.text(`Всего изображений в галерее: ${galleryCount}`);
        doc.moveDown();
        
        // Статистика по бронированиям
        doc.fontSize(14)
           .font(fontPath ? 'RussianFont' : 'Helvetica-Bold')
           .text('2. Статистика по бронированиям', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(10)
           .font(fontPath ? 'RussianFont' : 'Helvetica');
        doc.text(`Ожидают подтверждения: ${pendingBookings}`);
        doc.text(`Подтверждено: ${confirmedBookings}`);
        doc.text(`Отменено: ${cancelledBookings}`);
        doc.text(`Общая выручка: ${totalRevenue.toLocaleString()} ₽`);
        doc.text(`Средняя стоимость бронирования: ${Math.round(totalRevenue / (confirmedBookings || 1)).toLocaleString()} ₽`);
        doc.moveDown();
        
        // Последние бронирования
        doc.fontSize(14)
           .font(fontPath ? 'RussianFont' : 'Helvetica-Bold')
           .text('3. Последние бронирования', { underline: true });
        doc.moveDown(0.5);
        
        if (recentBookings.length > 0) {
            let y = doc.y;
            doc.fontSize(9).font(fontPath ? 'RussianFont' : 'Helvetica-Bold');
            doc.text('ID', 50, y);
            doc.text('Клиент', 100, y);
            doc.text('Номер', 200, y);
            doc.text('Даты', 300, y);
            doc.text('Сумма', 420, y);
            doc.text('Статус', 500, y);
            
            y += 20;
            
            for (const booking of recentBookings) {
                if (y > 750) {
                    doc.addPage();
                    y = 50;
                    doc.fontSize(9).font(fontPath ? 'RussianFont' : 'Helvetica-Bold');
                    doc.text('ID', 50, y);
                    doc.text('Клиент', 100, y);
                    doc.text('Номер', 200, y);
                    doc.text('Даты', 300, y);
                    doc.text('Сумма', 420, y);
                    doc.text('Статус', 500, y);
                    y += 20;
                }
                
                doc.fontSize(9).font(fontPath ? 'RussianFont' : 'Helvetica');
                doc.text(`#${booking.id}`, 50, y);
                doc.text(booking.User ? booking.User.name.substring(0, 25) : 'Не указан', 100, y);
                doc.text(booking.Room ? booking.Room.name.substring(0, 20) : 'Не указан', 200, y);
                doc.text(`${new Date(booking.checkIn).toLocaleDateString('ru-RU')} - ${new Date(booking.checkOut).toLocaleDateString('ru-RU')}`, 300, y);
                doc.text(`${booking.totalPrice.toLocaleString()} ₽`, 420, y);
                
                let statusText = '';
                if (booking.status === 'pending') statusText = 'Ожидает';
                else if (booking.status === 'confirmed') statusText = 'Подтверждено';
                else if (booking.status === 'cancelled') statusText = 'Отменено';
                doc.text(statusText, 500, y);
                
                y += 20;
            }
        } else {
            doc.text('Нет бронирований');
        }
        
        doc.end();
        
    } catch (error) {
        console.error('PDF export error:', error);
        res.redirect('/admin/dashboard?error=Ошибка при формировании отчёта');
    }
});

module.exports = router;