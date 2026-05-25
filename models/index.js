const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database/database.sqlite'),
    logging: false
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./User')(sequelize, DataTypes);
db.Booking = require('./Booking')(sequelize, DataTypes);
db.Service = require('./Service')(sequelize, DataTypes);
db.Room = require('./Room')(sequelize, DataTypes);
db.Doctor = require('./Doctor')(sequelize, DataTypes);
db.GalleryImage = require('./GalleryImage')(sequelize, DataTypes);

// Define associations
db.User.hasMany(db.Booking, { foreignKey: 'userId' });
db.Booking.belongsTo(db.User, { foreignKey: 'userId' });

db.Room.hasMany(db.Booking, { foreignKey: 'roomId' });
db.Booking.belongsTo(db.Room, { foreignKey: 'roomId' });

// Связь многие-ко-многим между Booking и Service
db.Booking.belongsToMany(db.Service, { through: 'BookingServices', foreignKey: 'bookingId' });
db.Service.belongsToMany(db.Booking, { through: 'BookingServices', foreignKey: 'serviceId' });

// Связь Service с Doctor (один ко многим)
db.Doctor.hasMany(db.Service, { foreignKey: 'doctorId' });
db.Service.belongsTo(db.Doctor, { foreignKey: 'doctorId' });

db.User.belongsTo(db.Doctor, { foreignKey: 'doctorId' });
db.Doctor.hasOne(db.User, { foreignKey: 'doctorId' });

module.exports = db;