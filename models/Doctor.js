module.exports = (sequelize, DataTypes) => {
    const Doctor = sequelize.define('Doctor', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        position: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        qualification: {
            type: DataTypes.STRING
        },
        experience: {
            type: DataTypes.INTEGER,
            comment: 'Стаж работы в годах'
        },
        image: {
            type: DataTypes.STRING
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Порядок отображения'
        }
    });

    return Doctor;
};