const express = require('express');
const router = express.Router();
const { Doctor } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/doctors', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const doctors = await Doctor.findAll({
            order: [['order', 'ASC'], ['name', 'ASC']]
        });
        
        res.render('admin/doctors', {
            title: 'Управление врачами',
            user: req.session.user,
            doctors: doctors
        });
    } catch (error) {
        console.error(error);
        res.redirect('/profile?error=Ошибка загрузки врачей');
    }
});

router.post('/doctors/add', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { name, position, description, qualification, experience, order } = req.body;
        
        if (!name || !position) {
            return res.redirect('/admin/doctors?error=Заполните обязательные поля (Имя и Должность)');
        }
        
        await Doctor.create({
            name,
            position,
            description: description || '',
            qualification: qualification || '',
            experience: experience ? parseInt(experience) : null,
            order: order ? parseInt(order) : 0
        });
        
        res.redirect('/admin/doctors?success=Врач "' + name + '" добавлен');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/doctors?error=Ошибка при добавлении врача');
    }
});

router.post('/doctors/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id);
        
        if (!doctor) {
            return res.redirect('/admin/doctors?error=Врач не найден');
        }
        
        const { name, position, description, qualification, experience, order } = req.body;
        
        await doctor.update({
            name: name || doctor.name,
            position: position || doctor.position,
            description: description !== undefined ? description : doctor.description,
            qualification: qualification !== undefined ? qualification : doctor.qualification,
            experience: experience ? parseInt(experience) : doctor.experience,
            order: order ? parseInt(order) : doctor.order
        });
        
        res.redirect('/admin/doctors?success=Врач "' + doctor.name + '" обновлен');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/doctors?error=Ошибка при обновлении врача');
    }
});

router.post('/doctors/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id);
        
        if (!doctor) {
            return res.redirect('/admin/doctors?error=Врач не найден');
        }
        
        const doctorName = doctor.name;
        await doctor.destroy();
        
        res.redirect('/admin/doctors?success=Врач "' + doctorName + '" удален');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/doctors?error=Ошибка при удалении врача');
    }
});

module.exports = router;