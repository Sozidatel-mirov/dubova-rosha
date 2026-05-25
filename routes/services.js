const express = require('express');
const router = express.Router();
const { Service } = require('../models');

router.get('/', async (req, res) => {
    try {
        const services = await Service.findAll();
        res.render('services', { 
            title: 'Наши услуги',
            services
        });
    } catch (error) {
        console.error(error);
        res.render('services', { title: 'Наши услуги', services: [] });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) {
            return res.redirect('/services');
        }
        res.render('service-detail', { 
            title: service.name,
            service
        });
    } catch (error) {
        console.error(error);
        res.redirect('/services');
    }
});

module.exports = router;