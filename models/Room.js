module.exports = (sequelize, DataTypes) => {
    const Room = sequelize.define('Room', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('standard', 'improved', 'luxury'),
            defaultValue: 'standard'
        },
        description: {
            type: DataTypes.TEXT
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        capacity: {
            type: DataTypes.INTEGER,
            defaultValue: 2
        },
        amenities: {
            type: DataTypes.TEXT
        },
        image: {
            type: DataTypes.STRING
        },
        isAvailable: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    });

    return Room;
};