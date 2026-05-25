const express = require('express');
const router = express.Router();
const { Booking, Room, Service, Doctor } = require('../models');
const { Agent } = require('node:https');

// Импорт GigaChat SDK
let GigaChat;
try {
    const imported = require('gigachat');
    GigaChat = imported.default || imported;
} catch (error) {
    console.error('GigaChat import error:', error);
}

// Полная информация о санатории (статическая + из БД)
const SANATORIUM_INFO = {
    name: 'Дубовая Роща',
    address: 'Оренбургская область, пос. Лесной, ул. Санаторная, 15',
    phone: '+7 (800) 123-45-67',
    phone2: '+7 (3532) 12-34-56',
    email: 'info@zdorovie.ru',
    workHours: 'Круглосуточно, без выходных',
    website: 'https://zdorovie.ru',
    inn: '1234567890',
    license: 'Лицензия № ЛО-56-01-002345 от 15.03.2020'
};

// Системный промпт с полным контекстом
const SYSTEM_PROMPT = `Ты — официальный ассистент санатория "Дубовая Роща". 
Ты должен отвечать ТОЛЬКО от лица этого санатория, используя информацию ниже.

КОНТАКТНАЯ ИНФОРМАЦИЯ:
- Телефон: ${SANATORIUM_INFO.phone} (дополнительный: ${SANATORIUM_INFO.phone2})
- Email: ${SANATORIUM_INFO.email}
- Адрес: ${SANATORIUM_INFO.address}
- Режим работы: ${SANATORIUM_INFO.workHours}
- Сайт: ${SANATORIUM_INFO.website}

ПРАВИЛА ОТВЕТОВ:
1. Отвечай вежливо, дружелюбно и профессионально
2. Используй ТОЛЬКО информацию из предоставленного контекста
3. Если гость спрашивает номер телефона — давай реальный номер ${SANATORIUM_INFO.phone}
4. Если гость спрашивает адрес — давай реальный адрес
5. Если гость спрашивает о ценах — ссылайся на актуальные цены из базы данных
6. Если не знаешь ответа — честно скажи: "Уточните, пожалуйста, у администратора по телефону ${SANATORIUM_INFO.phone}"
7. НЕ выдумывай информацию, которой у тебя нет
8. Отвечай ТОЛЬКО на русском языке

Ты помогаешь гостям с:
- Бронированием номеров
- Информацией о услугах и процедурах
- Данными о врачах
- Стоимостью проживания и услуг
- Контактной информацией
- Правилами проживания
- Трансфером и проездом`;

// Функция для получения контекста из БД
async function getSanatoriumContext() {
    try {
        const rooms = await Room.findAll({
            attributes: ['name', 'type', 'price', 'capacity', 'description', 'amenities'],
            order: [['price', 'ASC']]
        });
        
        const services = await Service.findAll({
            attributes: ['name', 'price', 'duration', 'category', 'description'],
            order: [['category', 'ASC']]
        });
        
        const doctors = await Doctor.findAll({
            attributes: ['name', 'position', 'qualification', 'experience', 'description']
        });
        
        return {
            rooms: rooms.map(r => ({ 
                name: r.name, 
                price: r.price, 
                capacity: r.capacity,
                amenities: r.amenities,
                type: r.type === 'standard' ? 'Стандарт' : (r.type === 'improved' ? 'Улучшенный' : 'Люкс')
            })),
            services: services.map(s => ({ 
                name: s.name, 
                price: s.price, 
                category: s.category === 'medical' ? 'Медицинская' : (s.category === 'wellness' ? 'Оздоровительная' : 'SPA'),
                duration: s.duration
            })),
            doctors: doctors.map(d => ({ 
                name: d.name, 
                position: d.position,
                experience: d.experience
            }))
        };
    } catch (error) {
        console.error('Error fetching context:', error);
        return { rooms: [], services: [], doctors: [] };
    }
}

// Формирование сообщения с контекстом
async function buildContextMessage(userQuestion) {
    const context = await getSanatoriumContext();
    
    // Формируем информацию о номерах
    let roomsText = '';
    if (context.rooms.length > 0) {
        roomsText = context.rooms.map(r => 
            `- ${r.name}: ${r.price} руб/сутки, до ${r.capacity} гостей, ${r.amenities || 'стандартная комплектация'}`
        ).join('\n');
    } else {
        roomsText = '- Информация о номерах временно недоступна';
    }
    
    // Формируем информацию об услугах
    let servicesText = '';
    if (context.services.length > 0) {
        const medical = context.services.filter(s => s.category === 'Медицинская');
        const wellness = context.services.filter(s => s.category === 'Оздоровительная');
        const spa = context.services.filter(s => s.category === 'SPA');
        
        if (medical.length > 0) {
            servicesText += `\nМедицинские услуги:\n${medical.map(s => `  - ${s.name}: ${s.price} руб, ${s.duration}`).join('\n')}`;
        }
        if (wellness.length > 0) {
            servicesText += `\nОздоровительные услуги:\n${wellness.map(s => `  - ${s.name}: ${s.price} руб, ${s.duration}`).join('\n')}`;
        }
        if (spa.length > 0) {
            servicesText += `\nSPA услуги:\n${spa.map(s => `  - ${s.name}: ${s.price} руб, ${s.duration}`).join('\n')}`;
        }
    } else {
        servicesText = '- Информация об услугах временно недоступна';
    }
    
    // Формируем информацию о врачах
    let doctorsText = '';
    if (context.doctors.length > 0) {
        doctorsText = context.doctors.map(d => 
            `- ${d.name}: ${d.position}, стаж ${d.experience || 'не указан'} лет`
        ).join('\n');
    } else {
        doctorsText = '- Информация о врачах временно недоступна';
    }
    
    return `
ВОТ АКТУАЛЬНАЯ ИНФОРМАЦИЯ О САНАТОРИИ "ДУБОВАЯ РОЩА" (используй ТОЛЬКО её):

=== КОНТАКТЫ ===
Телефон: ${SANATORIUM_INFO.phone}
Доп. телефон: ${SANATORIUM_INFO.phone2}
Email: ${SANATORIUM_INFO.email}
Адрес: ${SANATORIUM_INFO.address}
Режим работы: ${SANATORIUM_INFO.workHours}
Сайт: ${SANATORIUM_INFO.website}

=== НОМЕРА ===
${roomsText}

=== УСЛУГИ ===
${servicesText}

=== ВРАЧИ ===
${doctorsText}

ВОПРОС ГОСТЯ: ${userQuestion}

ОТВЕТЬ НА ВОПРОС, ИСПОЛЬЗУЯ ТОЛЬКО ЭТУ ИНФОРМАЦИЮ.
Если нужной информации нет — скажи: "Уточните, пожалуйста, у администратора по телефону ${SANATORIUM_INFO.phone}"
`;
}

// Эндпоинт для общения с ИИ
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Сообщение не может быть пустым' });
        }
        
        // Если GigaChat не загрузился
        if (!GigaChat) {
            console.log('GigaChat not available, using fallback');
            return res.json({ 
                service: 'fallback',
                response: `Извините, сервис ИИ временно недоступен. Вы можете связаться с нами по телефону ${SANATORIUM_INFO.phone} или написать на email ${SANATORIUM_INFO.email}.`,
                fallback: true 
            });
        }
        
        // Настройки HTTPS агента
        const httpsAgent = new Agent({
            rejectUnauthorized: false
        });
        
        // Инициализация клиента GigaChat
        const client = new GigaChat({
            credentials: process.env.GIGACHAT_CREDENTIALS,
            scope: process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS',
            model: 'GigaChat',
            timeout: 600,
            httpsAgent: httpsAgent
        });
        
        // Формируем сообщение с контекстом
        const contextMessage = await buildContextMessage(message);
        
        console.log('Sending request to GigaChat...');
        
        // Отправляем запрос в GigaChat
        const response = await client.chat({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: contextMessage }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });
        
        let assistantReply = response.choices[0]?.message?.content || 
            'Извините, не удалось получить ответ. Пожалуйста, позвоните нам по телефону ' + SANATORIUM_INFO.phone;
        
        // Замена плейсхолдеров на реальные данные (на случай, если модель их сгенерировала)
        assistantReply = assistantReply
            .replace(/\+7\s*[✱\*xX]{10,}/g, SANATORIUM_INFO.phone)
            .replace(/\[номер\s*телефона\]/gi, SANATORIUM_INFO.phone)
            .replace(/\[телефон\]/gi, SANATORIUM_INFO.phone)
            .replace(/\[адрес\]/gi, SANATORIUM_INFO.address);
        
        res.json({ response: assistantReply });
        
    } catch (error) {
        console.error('GigaChat API error:', error);
        
        let errorMessage = `Произошла техническая ошибка. Пожалуйста, свяжитесь с нами по телефону ${SANATORIUM_INFO.phone} или напишите на ${SANATORIUM_INFO.email}.`;
        
        if (error.message && error.message.includes('SSL')) {
            errorMessage = `Ошибка подключения. Пожалуйста, позвоните нам по телефону ${SANATORIUM_INFO.phone}.`;
        }
        
        res.status(500).json({ error: errorMessage });
    }
});

// Эндпоинт для проверки статуса
router.get('/status', (req, res) => {
    res.json({ 
        status: 'ok', 
        gigachatAvailable: !!GigaChat,
        credentialsSet: !!process.env.GIGACHAT_CREDENTIALS,
        sanatoriumInfo: {
            phone: SANATORIUM_INFO.phone,
            address: SANATORIUM_INFO.address
        }
    });
});

module.exports = router;