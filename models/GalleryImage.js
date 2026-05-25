module.exports = (sequelize, DataTypes) => {
    const GalleryImage = sequelize.define('GalleryImage', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        filename: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Имя файла изображения'
        },
        category: {
            type: DataTypes.ENUM('territory', 'rooms', 'procedures', 'nature'),
            allowNull: false,
            defaultValue: 'territory'
        },
        description: {
            type: DataTypes.TEXT
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Порядок отображения'
        }
    });

    return GalleryImage;
};