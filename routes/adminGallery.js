const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GalleryImage } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/images/gallery');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'gallery-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB лимит
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

router.get('/gallery', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const images = await GalleryImage.findAll({
            order: [['category', 'ASC'], ['order', 'ASC'], ['id', 'ASC']]
        });
        
        const territoryImages = images.filter(i => i.category === 'territory');
        const roomsImages = images.filter(i => i.category === 'rooms');
        const proceduresImages = images.filter(i => i.category === 'procedures');
        const natureImages = images.filter(i => i.category === 'nature');
        
        res.render('admin/gallery', {
            title: 'Управление галереей',
            user: req.session.user,
            territoryImages: territoryImages,
            roomsImages: roomsImages,
            proceduresImages: proceduresImages,
            natureImages: natureImages,
            allImages: images
        });
    } catch (error) {
        console.error(error);
        res.redirect('/profile?error=Ошибка загрузки галереи');
    }
});

router.post('/gallery/add', isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, category, description, order } = req.body;
        
        if (!title || !req.file) {
            return res.redirect('/admin/gallery?error=Заполните название и выберите изображение');
        }
        
        await GalleryImage.create({
            title: title,
            filename: '/images/gallery/' + req.file.filename,
            category: category || 'territory',
            description: description || '',
            order: order ? parseInt(order) : 0
        });
        
        res.redirect('/admin/gallery?success=Изображение добавлено');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/gallery?error=Ошибка при добавлении изображения');
    }
});

router.post('/gallery/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const image = await GalleryImage.findByPk(req.params.id);
        
        if (!image) {
            return res.redirect('/admin/gallery?error=Изображение не найдено');
        }
        
        const { title, category, description, order } = req.body;
        
        await image.update({
            title: title || image.title,
            category: category || image.category,
            description: description !== undefined ? description : image.description,
            order: order ? parseInt(order) : image.order
        });
        
        res.redirect('/admin/gallery?success=Изображение обновлено');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/gallery?error=Ошибка при обновлении');
    }
});

router.post('/gallery/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const image = await GalleryImage.findByPk(req.params.id);
        
        if (!image) {
            return res.redirect('/admin/gallery?error=Изображение не найдено');
        }
        
        const filePath = path.join(__dirname, '../public', image.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        await image.destroy();
        
        res.redirect('/admin/gallery?success=Изображение удалено');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/gallery?error=Ошибка при удалении');
    }
});

module.exports = router;