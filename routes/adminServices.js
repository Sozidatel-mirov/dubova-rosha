const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Service } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Настройка multer для загрузки изображений услуг
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/images/services');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'service-' + uniqueSuffix + ext);
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

// Страница управления услугами
router.get('/services', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const services = await Service.findAll({
            order: [['category', 'ASC'], ['name', 'ASC']]
        });
        
        const medicalServices = services.filter(s => s.category === 'medical');
        const wellnessServices = services.filter(s => s.category === 'wellness');
        const spaServices = services.filter(s => s.category === 'spa');
        
        res.render('admin/services', {
            title: 'Управление услугами',
            user: req.session.user,
            medicalServices: medicalServices,
            wellnessServices: wellnessServices,
            spaServices: spaServices,
            allServices: services
        });
    } catch (error) {
        console.error(error);
        res.redirect('/profile?error=Ошибка загрузки услуг');
    }
});

// Добавление новой услуги
router.post('/services/add', isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, duration, category, billingType } = req.body;
        
        if (!name || !price) {
            return res.redirect('/admin/services?error=Заполните обязательные поля');
        }
        
        let imagePath = null;
        if (req.file) {
            imagePath = '/images/services/' + req.file.filename;
        }
        
        await Service.create({
            name,
            description: description || '',
            price: parseFloat(price),
            duration: duration || '',
            category: category || 'wellness',
            billingType: billingType || 'daily',
            image: imagePath
        });
        
        res.redirect('/admin/services?success=Услуга "' + name + '" добавлена');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/services?error=Ошибка при добавлении услуги');
    }
});

// Редактирование услуги
router.post('/services/edit/:id', isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        
        if (!service) {
            return res.redirect('/admin/services?error=Услуга не найдена');
        }
        
        const { name, description, price, duration, category, billingType } = req.body;
        
        let updateData = {
            name: name || service.name,
            description: description !== undefined ? description : service.description,
            price: price ? parseFloat(price) : service.price,
            duration: duration !== undefined ? duration : service.duration,
            category: category || service.category,
            billingType: billingType || service.billingType
        };
        
        // Если загружено новое изображение
        if (req.file) {
            // Удаляем старое изображение
            if (service.image) {
                const oldImagePath = path.join(__dirname, '../public', service.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateData.image = '/images/services/' + req.file.filename;
        }
        
        await service.update(updateData);
        
        res.redirect('/admin/services?success=Услуга "' + service.name + '" обновлена');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/services?error=Ошибка при обновлении услуги');
    }
});

// Удаление услуги
router.post('/services/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        
        if (!service) {
            return res.redirect('/admin/services?error=Услуга не найдена');
        }
        
        // Удаляем изображение с диска
        if (service.image) {
            const imagePath = path.join(__dirname, '../public', service.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        const serviceName = service.name;
        await service.destroy();
        
        res.redirect('/admin/services?success=Услуга "' + serviceName + '" удалена');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/services?error=Ошибка при удалении услуги');
    }
});

module.exports = router;