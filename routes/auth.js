const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Регистрация
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, confirmPassword } = req.body;
        
        if (!name || !email || !phone || !password || !confirmPassword) {
            return res.redirect('/register?error=Пожалуйста, заполните все поля');
        }
        
        if (password !== confirmPassword) {
            return res.redirect('/register?error=Пароли не совпадают');
        }
        
        if (password.length < 4) {
            return res.redirect('/register?error=Пароль должен содержать минимум 4 символа');
        }
        
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.redirect('/register?error=Email уже зарегистрирован');
        }
        
        const user = await User.create({
            name,
            email,
            phone,
            password
        });
        
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            doctorId: user.doctorId || null
        };
        
        req.session.save((err) => {
            if (err) console.error('Session save error:', err);
            res.redirect('/profile');
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.redirect('/register?error=Ошибка регистрации');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.redirect('/login?error=Введите email и пароль');
        }
        
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.redirect('/login?error=Неверный email или пароль');
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.redirect('/login?error=Неверный email или пароль');
        }
        
        // Важно: сохраняем doctorId в сессию
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            doctorId: user.doctorId  // Это поле должно быть
        };
        
        console.log('Login - user role:', user.role, 'doctorId:', user.doctorId);
        
        req.session.save((err) => {
            if (err) console.error('Session save error:', err);
            res.redirect('/profile');
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.redirect('/login?error=Ошибка входа');
    }
});

// Выход
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.redirect('/');
    });
});

module.exports = router;