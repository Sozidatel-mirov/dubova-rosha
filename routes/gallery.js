const express = require('express');
const router = express.Router();
const { GalleryImage } = require('../models');

router.get('/', async (req, res) => {
    try {
        const images = await GalleryImage.findAll({
            order: [['category', 'ASC'], ['order', 'ASC'], ['id', 'ASC']]
        });
        
        res.render('gallery', { 
            title: 'Галерея',
            images: images || []
        });
    } catch (error) {
        console.error(error);
        res.render('gallery', { title: 'Галерея', images: [] });
    }
});

module.exports = router;