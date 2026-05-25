// ИИ-ассистент для санатория "Дубовая Роща"
(function() {
    // Ждём полной загрузки DOM
    document.addEventListener('DOMContentLoaded', function() {
        // Стили для виджета
        const styles = `
            .ai-chat-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                font-family: 'Inter', sans-serif;
            }
            
            .ai-chat-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #2c6e49, #1e4a32);
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                border: none;
            }
            
            .ai-chat-button:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 16px rgba(0,0,0,0.2);
            }
            
            .ai-chat-button svg {
                width: 32px;
                height: 32px;
                fill: white;
            }
            
            .ai-chat-window {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 380px;
                height: 500px;
                background: white;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                display: none;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid #e0e0e0;
            }
            
            .ai-chat-window.open {
                display: flex;
            }
            
            .ai-chat-header {
                background: linear-gradient(135deg, #2c6e49, #1e4a32);
                color: white;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .ai-chat-header h3 {
                margin: 0;
                font-size: 16px;
            }
            
            .ai-chat-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
            }
            
            .ai-chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                background: #f5f5f5;
            }
            
            .message {
                max-width: 85%;
                padding: 10px 12px;
                border-radius: 15px;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .message.user {
                background: #2c6e49;
                color: white;
                align-self: flex-end;
                border-bottom-right-radius: 5px;
            }
            
            .message.assistant {
                background: white;
                color: #333;
                align-self: flex-start;
                border-bottom-left-radius: 5px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }
            
            .ai-chat-input-area {
                padding: 15px;
                background: white;
                border-top: 1px solid #e0e0e0;
                display: flex;
                gap: 10px;
            }
            
            .ai-chat-input {
                flex: 1;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 25px;
                font-size: 14px;
                outline: none;
            }
            
            .ai-chat-input:focus {
                border-color: #2c6e49;
            }
            
            .ai-chat-send {
                background: #2c6e49;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 25px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .ai-chat-send:hover {
                background: #1e4a32;
            }
            
            .typing-indicator {
                display: flex;
                gap: 4px;
                padding: 10px 12px;
                background: white;
                border-radius: 15px;
                align-self: flex-start;
                border-bottom-left-radius: 5px;
            }
            
            .typing-indicator span {
                width: 8px;
                height: 8px;
                background: #999;
                border-radius: 50%;
                animation: typing 1.4s infinite ease-in-out;
            }
            
            .typing-indicator span:nth-child(1) { animation-delay: 0s; }
            .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
            
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
                30% { transform: translateY(-8px); opacity: 1; }
            }
            
            @media (max-width: 480px) {
                .ai-chat-window {
                    width: 100vw;
                    height: 100vh;
                    bottom: 0;
                    right: 0;
                    border-radius: 0;
                }
                
                .ai-chat-button {
                    bottom: 10px;
                    right: 10px;
                }
            }
        `;
        
        // Добавление стилей
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        
        // HTML структура виджета
        const widgetHTML = `
            <div class="ai-chat-widget">
                <button class="ai-chat-button" id="aiChatButton">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.52.37 2.93 1.03 4.19L2 22l5.81-1.03C9.07 21.63 10.48 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" fill="white"/>
                        <circle cx="8" cy="12" r="1.5" fill="#2c6e49"/>
                        <circle cx="12" cy="12" r="1.5" fill="#2c6e49"/>
                        <circle cx="16" cy="12" r="1.5" fill="#2c6e49"/>
                    </svg>
                </button>
                <div class="ai-chat-window" id="aiChatWindow">
                    <div class="ai-chat-header">
                        <h3>Ассистент санатория</h3>
                        <button class="ai-chat-close" id="aiChatClose">×</button>
                    </div>
                    <div class="ai-chat-messages" id="aiChatMessages">
                        <div class="message assistant">Здравствуйте! Я виртуальный ассистент санатория "Дубовая Роща". Задайте мне вопрос о номерах, услугах, врачах или бронировании. Чем могу помочь?</div>
                    </div>
                    <div class="ai-chat-input-area">
                        <input type="text" class="ai-chat-input" id="aiChatInput" placeholder="Напишите ваш вопрос...">
                        <button class="ai-chat-send" id="aiChatSend">Отправить</button>
                    </div>
                </div>
            </div>
        `;
        
        // Добавление виджета на страницу
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        
        // Элементы
        const button = document.getElementById('aiChatButton');
        const chatWindow = document.getElementById('aiChatWindow');
        const close = document.getElementById('aiChatClose');
        const input = document.getElementById('aiChatInput');
        const send = document.getElementById('aiChatSend');
        const messagesContainer = document.getElementById('aiChatMessages');
        
        // Проверка наличия элементов
        if (!button || !chatWindow || !close || !input || !send || !messagesContainer) {
            console.error('AI Chat: Не удалось найти элементы виджета');
            return;
        }
        
        // Открытие/закрытие окна
        button.addEventListener('click', () => {
            chatWindow.classList.toggle('open');
        });
        
        close.addEventListener('click', () => {
            chatWindow.classList.remove('open');
        });
        
        // Показ индикатора печати
        function showTypingIndicator() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'typing-indicator';
            typingDiv.id = 'typing-indicator';
            typingDiv.innerHTML = '<span></span><span></span><span></span>';
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function hideTypingIndicator() {
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.remove();
        }
        
        // Добавление сообщения в чат
        function addMessage(text, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
            messageDiv.textContent = text;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // Отправка сообщения
        async function sendMessage() {
            const message = input.value.trim();
            if (!message) return;
            
            // Очищаем поле и добавляем сообщение пользователя
            input.value = '';
            addMessage(message, true);
            
            // Показываем индикатор загрузки
            showTypingIndicator();
            
            try {
                const response = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message: message })
                });
                
                const data = await response.json();
                hideTypingIndicator();
                
                if (response.ok) {
                    addMessage(data.response, false);
                } else {
                    addMessage(data.error || 'Произошла ошибка. Попробуйте позже.', false);
                }
            } catch (error) {
                console.error('AI Chat error:', error);
                hideTypingIndicator();
                addMessage('Ошибка подключения к серверу. Пожалуйста, попробуйте позже.', false);
            }
        }
        
        // Обработчики событий
        send.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    });
})();