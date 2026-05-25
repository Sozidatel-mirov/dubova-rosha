const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.redirect('/profile?error=У вас нет прав для этого действия');
};

const isDoctor = (req, res, next) => {
    console.log('isDoctor middleware - user role:', req.session.user?.role);
    console.log('isDoctor middleware - user doctorId:', req.session.user?.doctorId);
    
    if (req.session.user && req.session.user.role === 'doctor') {
        return next();
    }
    res.redirect('/profile?error=У вас нет прав для этого действия');
};

module.exports = { isAuthenticated, isAdmin, isDoctor };