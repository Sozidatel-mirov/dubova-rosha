module.exports = (sequelize, DataTypes) => {
    const Booking = sequelize.define('Booking', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        roomId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        checkIn: {
            type: DataTypes.DATE,
            allowNull: false
        },
        checkOut: {
            type: DataTypes.DATE,
            allowNull: false
        },
        guests: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: true
        },
        totalPrice: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
            defaultValue: 'pending'
        },
        notes: {
            type: DataTypes.TEXT
        },
        selectedServices: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'JSON строка с выбранными услугами'
        }
    });

    return Booking;
};