class ChatbotFullscreen {
    constructor() {
        this.responseManager = new ResponseManager();
        this.settings = {
            theme: 'light',
            fontSize: 'medium',
            soundEnabled: true,
            autoScroll: true
        };
        this.loadSettings();
    }

    async init() {
        console.log('🚀 Inicializando Chatbot ESPE...');
        
        await this.responseManager.init();
        this.setupEventListeners();
        this.applySettings();
        
        console.log('✅ Chatbot listo');
        return true;
    }

    setupEventListeners() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-button');
        const charCounter = document.querySelector('.char-counter');

        input.addEventListener('input', () => {
            const length = input.value.length;
            charCounter.textContent = `${length}/1000`;
            sendBtn.disabled = length === 0;
            this.autoResize(input);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        sendBtn.addEventListener('click', () => this.sendMessage());

        const voiceBtn = document.getElementById('voice-button');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                console.log('🎤 Función de voz no implementada');
            });
        }
    }

    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';
        input.style.height = 'auto';
        document.querySelector('.char-counter').textContent = '0/1000';
        document.getElementById('send-button').disabled = true;

        this.showTypingIndicator();

        try {
            const response = await this.responseManager.processQuery(message);
            
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addMessage(response.response, 'bot', response);
                this.playNotificationSound();
            }, 1000);

        } catch (error) {
            console.error('Error procesando mensaje:', error);
            this.hideTypingIndicator();
            this.addMessage('Lo siento, hubo un error. Intenta de nuevo.', 'bot');
        }
    }

    async sendQuickMessage(messageOrIntent) {
        if (typeof messageOrIntent === 'string' && !messageOrIntent.includes(' ')) {
            this.addMessage(`📋 ${messageOrIntent.replace(/_/g, ' ')}`, 'user');
            this.showTypingIndicator();

            const response = this.responseManager.processQuickMessage(messageOrIntent);
            
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addMessage(response.response, 'bot', response);
                this.playNotificationSound();
            }, 800);
        } else {
            const input = document.getElementById('chat-input');
            input.value = messageOrIntent;
            input.focus();
            this.autoResize(input);
            
            setTimeout(() => this.sendMessage(), 100);
        }
    }

    addMessage(text, sender, metadata = null) {
        const messagesContainer = document.getElementById('chat-messages');
        
        const welcomeMsg = messagesContainer.querySelector('.welcome-message');
        if (welcomeMsg && sender === 'user') {
            welcomeMsg.style.display = 'none';
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${this.formatMessage(text)}</div>
                    <div class="message-time">${this.getTimestamp()}</div>
                </div>
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="bot-name">Asistente ESPE</span>
                    </div>
                    <div class="message-text">${this.formatMessage(text)}</div>
                    <div class="message-footer">
                        <span class="message-time">${this.getTimestamp()}</span>
                        ${metadata ? `<span class="confidence">Confianza: ${(metadata.confidence * 100).toFixed(0)}%</span>` : ''}
                    </div>
                </div>
            `;
        }

        messagesContainer.appendChild(messageDiv);
        
        if (this.settings.autoScroll) {
            this.scrollToBottom();
        }
    }

    formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '• ');
    }

    getTimestamp() {
        return new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.style.display = 'flex';
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    scrollToBottom() {
        const container = document.getElementById('chat-messages');
        container.scrollTop = container.scrollHeight;
    }

    clearChat() {
        const messagesContainer = document.getElementById('chat-messages');
        const messages = messagesContainer.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        
        const welcomeMsg = messagesContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.style.display = 'block';
        }
        
        console.log('🗑️ Chat limpiado');
    }

    changeTheme(theme) {
        this.settings.theme = theme;
        document.body.className = `theme-${theme}`;
        this.saveSettings();
        console.log(`🎨 Tema cambiado a: ${theme}`);
    }

    changeFontSize(size) {
        this.settings.fontSize = size;
        document.body.setAttribute('data-font-size', size);
        this.saveSettings();
        console.log(`📝 Fuente cambiada a: ${size}`);
    }

    toggleSound() {
        this.settings.soundEnabled = !this.settings.soundEnabled;
        this.saveSettings();
        console.log(`🔊 Sonido: ${this.settings.soundEnabled ? 'ON' : 'OFF'}`);
    }

    toggleAutoScroll() {
        this.settings.autoScroll = !this.settings.autoScroll;
        this.saveSettings();
        console.log(`📜 Auto-scroll: ${this.settings.autoScroll ? 'ON' : 'OFF'}`);
    }

    playNotificationSound() {
        if (this.settings.soundEnabled) {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYeBzON1O/QgC4HC3nE8+OZXA0PU6jh+LJiGQU7k9n+zHkpBSF8xfLZigwGJnbF8N+QQAoUXrTp66hVFApGn+DyvmYeKLVi2KNEUXE7yQGzDXSt0NDZQABQW5T3AwEIAA==');
            audio.volume = 0.3;
            audio.play().catch(() => {});
        }
    }

    exportChat() {
        const messages = document.querySelectorAll('.message');
        let chatText = 'CHATBOT ESPE - CONVERSACIÓN\n';
        chatText += '================================\n\n';
        
        messages.forEach(msg => {
            const sender = msg.classList.contains('user-message') ? 'USUARIO' : 'ASISTENTE';
            const text = msg.querySelector('.message-text').textContent;
            const time = msg.querySelector('.message-time').textContent;
            
            chatText += `[${time}] ${sender}: ${text}\n\n`;
        });
        
        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-espe-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('💾 Chat exportado');
    }

    loadSettings() {
        const saved = localStorage.getItem('chatbot-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    saveSettings() {
        localStorage.setItem('chatbot-settings', JSON.stringify(this.settings));
    }

    applySettings() {
        this.changeTheme(this.settings.theme);
        this.changeFontSize(this.settings.fontSize);
        
        const elements = {
            'theme-selector': this.settings.theme,
            'font-size-selector': this.settings.fontSize,
            'sound-enabled': this.settings.soundEnabled,
            'auto-scroll': this.settings.autoScroll
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });
    }
}

function sendQuickMessage(messageOrIntent) {
    if (window.chatbotApp) {
        window.chatbotApp.sendQuickMessage(messageOrIntent);
    }
}

function clearChat() {
    if (window.chatbotApp) {
        window.chatbotApp.clearChat();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('chatbot-sidebar');
    sidebar.classList.toggle('hidden');
}

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('open');
}

function changeTheme() {
    const theme = document.getElementById('theme-selector').value;
    if (window.chatbotApp) {
        window.chatbotApp.changeTheme(theme);
    }
}

function changeFontSize() {
    const size = document.getElementById('font-size-selector').value;
    if (window.chatbotApp) {
        window.chatbotApp.changeFontSize(size);
    }
}

function toggleSound() {
    if (window.chatbotApp) {
        window.chatbotApp.toggleSound();
    }
}

function toggleAutoScroll() {
    if (window.chatbotApp) {
        window.chatbotApp.toggleAutoScroll();
    }
}

function getSystemStats() {
    if (window.chatbotApp?.responseManager) {
        const stats = window.chatbotApp.responseManager.getStats();
        console.log('📊 Estadísticas:', stats);
        alert(`📊 ESTADÍSTICAS SISTEMA:
        
Total consultas: ${stats.total_queries}
Uso Gemini: ${stats.gemini_usage}
Uso Corpus: ${stats.corpus_usage}  
Respaldo JSON: ${stats.json_usage}

Componentes:
✅ Gemini: ${stats.components.gemini ? 'Activo' : 'Inactivo'}
✅ Corpus: ${stats.components.corpus ? 'Activo' : 'Inactivo'}
✅ JSON: ${stats.components.json ? 'Activo' : 'Inactivo'}`);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando aplicación...');
    
    window.chatbotApp = new ChatbotFullscreen();
    await window.chatbotApp.init();
    
    console.log('✅ Aplicación lista');
});