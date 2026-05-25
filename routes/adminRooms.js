const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Room } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/images/rooms');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'room-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Только изображения!'));
    }
});
router.get('/rooms', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const rooms = await Room.findAll({
            order: [['type', 'ASC'], ['order', 'ASC'], ['price', 'ASC']]
        });
        
        const standardRooms = rooms.filter(r => r.type === 'standard');
        const improvedRooms = rooms.filter(r => r.type === 'improved');
        const luxuryRooms = rooms.filter(r => r.type === 'luxury');
        
        res.render('admin/rooms', {
            title: 'Управление номерами',
            user: req.session.user,
            standardRooms: standardRooms,
            improvedRooms: improvedRooms,
            luxuryRooms: luxuryRooms,
            allRooms: rooms
        });
    } catch (error) {
        console.error(error);
        res.redirect('/profile?error=Ошибка загрузки номеров');
    }
});

router.post('/rooms/add', isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, type, description, price, capacity, amenities, order, isAvailable } = req.body;
        
        if (!name || !price) {
            return res.redirect('/admin/rooms?error=Заполните обязательные поля (Название и Цена)');
        }
        
        let imagePath = null;
        if (req.file) {
            imagePath = '/images/rooms/' + req.file.filename;
        }
        
        await Room.create({
            name: name,
            type: type || 'standard',
            description: description || '',
            price: parseFloat(price),
            capacity: capacity ? parseInt(capacity) : 2,
            amenities: amenities || '',
            image: imagePath,
            order: order ? parseInt(order) : 0,
            isAvailable: isAvailable === 'true'
        });
        
        res.redirect('/admin/rooms?success=Номер "' + name + '" добавлен');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/rooms?error=Ошибка при добавлении номера');
    }
});

router.post('/rooms/edit/:id', isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id);
        
        if (!room) {
            return res.redirect('/admin/rooms?error=Номер не найден');
        }
        
        const { name, type, description, price, capacity, amenities, order, isAvailable } = req.body;
        
        let updateData = {
            name: name || room.name,
            type: type || room.type,
            description: description !== undefined ? description : room.description,
            price: price ? parseFloat(price) : room.price,
            capacity: capacity ? parseInt(capacity) : room.capacity,
            amenities: amenities !== undefined ? amenities : room.amenities,
            order: order ? parseInt(order) : room.order,
            isAvailable: isAvailable === 'true'
        };
        
        if (req.file) {
            if (room.image) {
                const oldImagePath = path.join(__dirname, '../public', room.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateData.image = '/images/rooms/' + req.file.filename;
        }
        
        await room.update(updateData);
        
        res.redirect('/admin/rooms?success=Номер "' + room.name + '" обновлен');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/rooms?error=Ошибка при обновлении номера');
    }
});

router.post('/rooms/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id);
        
        if (!room) {
            return res.redirect('/admin/rooms?error=Номер не найден');
        }
        
        if (room.image) {
            const imagePath = path.join(__dirname, '../public', room.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        const roomName = room.name;
        await room.destroy();
        
        res.redirect('/admin/rooms?success=Номер "' + roomName + '" удален');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/rooms?error=Ошибка при удалении номера');
    }
});

module.exports = router;