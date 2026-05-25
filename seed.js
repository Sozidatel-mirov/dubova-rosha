const { sequelize, User, Room, Service, Booking, Doctor, GalleryImage } = require('./models');
const bcrypt = require('bcrypt');

const seedDatabase = async () => {
    try {
        await sequelize.sync({ force: true });
        console.log('База данных пересоздана');

        const salt = await bcrypt.genSalt(10);

        // ========== 1. ПОЛЬЗОВАТЕЛИ ==========
        console.log('\n1. Создание пользователей...');
        
        const users = await User.bulkCreate([
            { name: 'Иван Петров', email: 'ivan@example.com', phone: '+7 (901) 123-45-67', password: await bcrypt.hash('password123', salt), role: 'user', doctorId: null },
            { name: 'Мария Иванова', email: 'maria@example.com', phone: '+7 (902) 234-56-78', password: await bcrypt.hash('password123', salt), role: 'user', doctorId: null },
            { name: 'Алексей Смирнов', email: 'alex@example.com', phone: '+7 (903) 345-67-89', password: await bcrypt.hash('password123', salt), role: 'user', doctorId: null },
            { name: 'Елена Козлова', email: 'elena@example.com', phone: '+7 (904) 456-78-90', password: await bcrypt.hash('password123', salt), role: 'user', doctorId: null },
            { name: 'Дмитрий Соколов', email: 'dmitry@example.com', phone: '+7 (905) 567-89-01', password: await bcrypt.hash('password123', salt), role: 'user', doctorId: null },
            { name: 'Администратор', email: 'admin@zdorovie.ru', phone: '+7 (800) 123-45-67', password: await bcrypt.hash('admin123', salt), role: 'admin', doctorId: null }
        ]);
        console.log(`   Создано ${users.length} пользователей`);

        // ========== 2. ВРАЧИ ==========
        console.log('\n2. Создание врачей...');
        
        const doctors = await Doctor.bulkCreate([
            { name: 'Петрова Анна Сергеевна', position: 'Главный врач, терапевт', description: 'Специализируется на восстановительной медицине и реабилитации.', qualification: 'Высшая квалификационная категория', experience: 25, order: 1 },
            { name: 'Кузнецов Михаил Андреевич', position: 'Кардиолог', description: 'Ведет пациентов с заболеваниями сердечно-сосудистой системы.', qualification: 'Кандидат медицинских наук', experience: 18, order: 2 },
            { name: 'Соколова Елена Владимировна', position: 'Невролог', description: 'Лечение заболеваний нервной системы, реабилитация после инсультов.', qualification: 'Высшая квалификационная категория', experience: 20, order: 3 },
            { name: 'Волков Дмитрий Игоревич', position: 'Физиотерапевт', description: 'Назначает и проводит физиотерапевтические процедуры.', qualification: 'Первая квалификационная категория', experience: 15, order: 4 },
            { name: 'Морозова Ирина Павловна', position: 'Эндокринолог', description: 'Диагностика и лечение заболеваний эндокринной системы.', qualification: 'Кандидат медицинских наук', experience: 12, order: 5 }
        ]);
        console.log(`   Создано ${doctors.length} врачей`);

        // ========== 3. ПОЛЬЗОВАТЕЛИ-ВРАЧИ ==========
        console.log('\n3. Создание пользователей-врачей...');
        
        const doctorUsers = await User.bulkCreate([
            { name: 'Петрова Анна Сергеевна', email: 'anna.petrova@zdorovie.ru', phone: '+7 (901) 111-11-11', password: await bcrypt.hash('doctor123', salt), role: 'doctor', doctorId: 1 },
            { name: 'Кузнецов Михаил Андреевич', email: 'mikhail.kuznetsov@zdorovie.ru', phone: '+7 (901) 222-22-22', password: await bcrypt.hash('doctor123', salt), role: 'doctor', doctorId: 2 },
            { name: 'Соколова Елена Владимировна', email: 'elena.sokolova@zdorovie.ru', phone: '+7 (901) 333-33-33', password: await bcrypt.hash('doctor123', salt), role: 'doctor', doctorId: 3 },
            { name: 'Волков Дмитрий Игоревич', email: 'dmitry.volkov@zdorovie.ru', phone: '+7 (901) 444-44-44', password: await bcrypt.hash('doctor123', salt), role: 'doctor', doctorId: 4 },
            { name: 'Морозова Ирина Павловна', email: 'irina.morozova@zdorovie.ru', phone: '+7 (901) 555-55-55', password: await bcrypt.hash('doctor123', salt), role: 'doctor', doctorId: 5 }
        ]);
        console.log(`   Создано ${doctorUsers.length} пользователей-врачей`);

        // ========== 4. НОМЕРА ==========
        console.log('\n4. Создание номеров...');
        
        const rooms = await Room.bulkCreate([
            { name: 'Стандартный одноместный', type: 'standard', description: 'Уютный номер площадью 18 кв.м с современной мебелью.', price: 4000, capacity: 1, amenities: 'Односпальная кровать, душ, телевизор, кондиционер', order: 1, isAvailable: true },
            { name: 'Стандартный двухместный', type: 'standard', description: 'Просторный номер 22 кв.м с двумя отдельными кроватями.', price: 6000, capacity: 2, amenities: 'Две односпальные кровати, душ, телевизор, кондиционер', order: 2, isAvailable: true },
            { name: 'Стандартный семейный', type: 'standard', description: 'Семейный номер 25 кв.м с двуспальной кроватью.', price: 7500, capacity: 3, amenities: 'Двуспальная кровать, диван, душ, телевизор', order: 3, isAvailable: true },
            { name: 'Улучшенный студия', type: 'improved', description: 'Номер-студия 30 кв.м с современным дизайном.', price: 8500, capacity: 2, amenities: 'Широкие кровати, ванна, телевизор, чайная зона', order: 1, isAvailable: true },
            { name: 'Улучшенный с видом на парк', type: 'improved', description: 'Номер с панорамным видом на парк 32 кв.м.', price: 9500, capacity: 2, amenities: 'Широкие кровати, ванна, телевизор, балкон', order: 2, isAvailable: true },
            { name: 'Люкс стандартный', type: 'luxury', description: 'Премиальный номер 50 кв.м с роскошным интерьером.', price: 14000, capacity: 2, amenities: 'Кровать King-size, джакузи, телевизор, балкон', order: 1, isAvailable: true },
            { name: 'Люкс президентский', type: 'luxury', description: 'Эксклюзивный номер 80 кв.м с отдельной гостиной.', price: 20000, capacity: 4, amenities: 'Кровать King-size, джакузи, телевизор, панорамный балкон', order: 2, isAvailable: true }
        ]);
        console.log(`   Создано ${rooms.length} номеров`);

        // ========== 5. УСЛУГИ ==========
        console.log('\n5. Создание услуг...');
        
        const services = await Service.bulkCreate([
            // Медицинские услуги
            { name: 'Консультация терапевта', description: 'Первичный осмотр, сбор анамнеза, назначение обследований.', price: 1500, duration: '30 мин', category: 'medical', billingType: 'once', doctorId: 1 },
            { name: 'Консультация кардиолога', description: 'Осмотр сердца и сосудов, ЭКГ, назначение кардиологических процедур.', price: 2000, duration: '40 мин', category: 'medical', billingType: 'once', doctorId: 2 },
            { name: 'Консультация невролога', description: 'Диагностика нервной системы, лечение неврологических заболеваний.', price: 2000, duration: '40 мин', category: 'medical', billingType: 'once', doctorId: 3 },
            { name: 'Консультация эндокринолога', description: 'Диагностика и лечение заболеваний эндокринной системы.', price: 2000, duration: '40 мин', category: 'medical', billingType: 'once', doctorId: 5 },
            { name: 'УЗИ диагностика', description: 'Ультразвуковое исследование органов.', price: 2500, duration: '30-60 мин', category: 'medical', billingType: 'once', doctorId: null },
            // Оздоровительные услуги
            { name: 'Классический массаж', description: 'Лечебный массаж всего тела для снятия напряжения.', price: 2000, duration: '60 мин', category: 'wellness', billingType: 'daily', doctorId: null },
            { name: 'Точечный массаж', description: 'Воздействие на активные точки тела.', price: 2500, duration: '45 мин', category: 'wellness', billingType: 'daily', doctorId: null },
            { name: 'Лечебная физкультура', description: 'Индивидуальные занятия с инструктором ЛФК.', price: 1000, duration: '45 мин', category: 'wellness', billingType: 'daily', doctorId: 4 },
            { name: 'Аквааэробика', description: 'Занятия в бассейне под руководством инструктора.', price: 800, duration: '45 мин', category: 'wellness', billingType: 'daily', doctorId: null },
            // SPA услуги
            { name: 'Лечебные ванны', description: 'Хвойные, жемчужные, минеральные ванны.', price: 1500, duration: '20 мин', category: 'spa', billingType: 'daily', doctorId: null },
            { name: 'Циркулярный душ', description: 'Гидромассаж всего тела.', price: 1200, duration: '15 мин', category: 'spa', billingType: 'daily', doctorId: null },
            { name: 'Физиотерапия', description: 'Магнитотерапия, лазерная терапия, УВЧ.', price: 1000, duration: '20-30 мин', category: 'spa', billingType: 'daily', doctorId: null },
            { name: 'Соляная пещера', description: 'Галотерапия для лечения заболеваний дыхательной системы.', price: 1000, duration: '40 мин', category: 'spa', billingType: 'daily', doctorId: null }
        ]);
        console.log(`   Создано ${services.length} услуг`);

        // ========== 6. БРОНИРОВАНИЯ ==========
        console.log('\n6. Создание бронирований...');
        
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        const twoWeeksLater = new Date();
        twoWeeksLater.setDate(today.getDate() + 14);
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(today.getDate() - 14);
        
        const bookings = await Booking.bulkCreate([
            { userId: 1, roomId: 2, checkIn: today, checkOut: nextWeek, guests: 1, totalPrice: 6000 * 7, status: 'confirmed', notes: 'Просьба предоставить номер с видом на парк' },
            { userId: 2, roomId: 4, checkIn: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), checkOut: new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000), guests: 1, totalPrice: 8500 * 7, status: 'confirmed', notes: 'Нужны дополнительные полотенца' },
            { userId: 3, roomId: 7, checkIn: nextWeek, checkOut: twoWeeksLater, guests: 1, totalPrice: 20000 * 7, status: 'pending', notes: 'Пожелания: вегетарианское питание' },
            { userId: 4, roomId: 5, checkIn: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), checkOut: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), guests: 1, totalPrice: 9500 * 7, status: 'pending', notes: 'Нужна детская кроватка' },
            { userId: 5, roomId: 6, checkIn: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), checkOut: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000), guests: 1, totalPrice: 14000 * 7, status: 'pending', notes: 'Нужно два номера рядом' },
            { userId: 1, roomId: 1, checkIn: lastWeek, checkOut: today, guests: 1, totalPrice: 4000 * 7, status: 'cancelled', notes: 'Отмена по семейным обстоятельствам' },
            { userId: 2, roomId: 3, checkIn: twoWeeksAgo, checkOut: lastWeek, guests: 1, totalPrice: 7500 * 7, status: 'cancelled', notes: 'Передумали' }
        ]);
        console.log(`   Создано ${bookings.length} бронирований`);

        // ========== 7. ГАЛЕРЕЯ ==========
        console.log('\n7. Создание изображений галереи...');
        
        const galleryImages = await GalleryImage.bulkCreate([
            { title: 'Главный корпус', filename: '/images/gallery/territory1.jpg', category: 'territory', order: 1 },
            { title: 'Бассейн', filename: '/images/gallery/territory2.jpg', category: 'territory', order: 2 },
            { title: 'Стандартный номер', filename: '/images/gallery/room1.jpg', category: 'rooms', order: 1 },
            { title: 'Номер Люкс', filename: '/images/gallery/room2.jpg', category: 'rooms', order: 2 },
            { title: 'Массажный кабинет', filename: '/images/gallery/procedure1.jpg', category: 'procedures', order: 1 },
            { title: 'Физиотерапия', filename: '/images/gallery/procedure2.jpg', category: 'procedures', order: 2 },
            { title: 'Парк', filename: '/images/gallery/nature1.jpg', category: 'nature', order: 1 },
            { title: 'Озеро', filename: '/images/gallery/nature2.jpg', category: 'nature', order: 2 }
        ]);
        console.log(`   Создано ${galleryImages.length} изображений`);

        // ========== 8. ВЫВОД ИТОГОВ ==========
        console.log('\n' + '='.repeat(50));
        console.log('ЗАПОЛНЕНИЕ БАЗЫ ДАННЫХ ЗАВЕРШЕНО');
        console.log('='.repeat(50));
        
        console.log('\nСтатистика:');
        console.log(`   Пользователей: ${users.length + doctorUsers.length}`);
        console.log(`   Врачей: ${doctors.length}`);
        console.log(`   Номеров: ${rooms.length}`);
        console.log(`   Услуг: ${services.length}`);
        console.log(`   Бронирований: ${bookings.length}`);
        console.log(`   Изображений галереи: ${galleryImages.length}`);
        
        console.log('\nТестовые данные для входа:');
        console.log('   Администратор: admin@zdorovie.ru / admin123');
        console.log('   Пользователь: ivan@example.com / password123');
        console.log('   Врач: anna.petrova@zdorovie.ru / doctor123');
        
        await sequelize.close();
        console.log('\nСоединение с БД закрыто');
        
    } catch (error) {
        console.error('\nОшибка при заполнении БД:', error);
        process.exit(1);
    }
};

seedDatabase();