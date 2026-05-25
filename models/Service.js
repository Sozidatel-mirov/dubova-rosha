module.exports = (sequelize, DataTypes) => {
    const Service = sequelize.define('Service', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        duration: {
            type: DataTypes.STRING
        },
        category: {
            type: DataTypes.ENUM('medical', 'wellness', 'spa'),
            defaultValue: 'wellness'
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true
        },
        billingType: {
            type: DataTypes.ENUM('once', 'daily'),
            defaultValue: 'daily'
        },
        doctorId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Doctors',
                key: 'id'
            },
            comment: 'Связанный врач для медицинских услуг'
        }
    });

    return Service;
};