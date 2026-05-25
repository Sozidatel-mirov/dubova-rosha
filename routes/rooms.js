const express = require('express');
const router = express.Router();
const { Room } = require('../models');

// Страница со списком номеров
router.get('/', async (req, res) => {
    try {
        const rooms = await Room.findAll({
            order: [['type', 'ASC'], ['order', 'ASC'], ['price', 'ASC']]
        });
        res.render('rooms', { 
            title: 'Номера',
            rooms: rooms || [],
            user: req.session.user || null
        });
    } catch (error) {
        console.error(error);
        res.render('rooms', { title: 'Номера', rooms: [], user: req.session.user || null });
    }
});

// Детальная страница номера
router.get('/:id', async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id);
        
        if (!room) {
            return res.redirect('/rooms?error=Номер не найден');
        }
        
        res.render('room-detail', {
            title: room.name,
            room: room,
            user: req.session.user || null
        });
    } catch (error) {
        console.error(error);
        res.redirect('/rooms?error=Ошибка загрузки страницы номера');
    }
});

module.exports = router;