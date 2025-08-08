/* filepath: js/chatbot/chatbot.js */
class Chatbot {
    constructor() {
        this.isOpen = false;
        this.responseManager = new ResponseManager();
        this.messages = [];
        this.isTyping = false;
        
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // Delay para asegurar que main.js haya terminado de cargar
            setTimeout(() => this.init(), 1000);
        }
    }

    async init() {
        console.log('🚀 Inicializando Chatbot Flotante...');
        this.createChatbotElements();
        this.attachEventListeners();
        await this.responseManager.init();
        
        // Mensaje de bienvenida mejorado
        const welcomeMessage = `🎓 ¡Hola! Soy tu **Asistente ESPE** especializado en prevención volcánica del Cotopaxi.

¿En qué puedo ayudarte hoy?`;
        
        this.addMessage('bot', welcomeMessage);
        this.showQuickSuggestions();
        console.log('✅ Chatbot Flotante listo');
    }

    createChatbotElements() {
        // Crear botón flotante con ícono de chat con burbujas
        const floatBtn = document.createElement('button');
        floatBtn.className = 'chatbot-float-btn';
        floatBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,3C6.5,3 2,6.58 2,11A7.18,7.18 0 0,0 2.64,14.34L1.42,18.05C1.13,18.89 1.78,19.7 2.66,19.54L6.84,18.96C8.28,19.61 10.1,20 12,20C17.5,20 22,16.42 22,11C22,6.58 17.5,3 12,3M8,13A2,2 0 0,1 6,11A2,2 0 0,1 8,9A2,2 0 0,1 10,11A2,2 0 0,1 8,13M12,13A2,2 0 0,1 10,11A2,2 0 0,1 12,9A2,2 0 0,1 14,11A2,2 0 0,1 12,13M16,13A2,2 0 0,1 14,11A2,2 0 0,1 16,9A2,2 0 0,1 18,11A2,2 0 0,1 16,13Z"/>
            </svg>
            <div class="chatbot-badge" id="chatbot-badge" style="display: none;">1</div>
        `;
        floatBtn.onclick = () => this.toggleChat();
        document.body.appendChild(floatBtn);

        // Crear contenedor del chat con ícono de chat también
        const chatContainer = document.createElement('div');
        chatContainer.className = 'chatbot-container hidden';
        chatContainer.innerHTML = `
            <div class="chatbot-header">
                <h3 class="chatbot-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,3C6.5,3 2,6.58 2,11A7.18,7.18 0 0,0 2.64,14.34L1.42,18.05C1.13,18.89 1.78,19.7 2.66,19.54L6.84,18.96C8.28,19.61 10.1,20 12,20C17.5,20 22,16.42 22,11C22,6.58 17.5,3 12,3M8,13A2,2 0 0,1 6,11A2,2 0 0,1 8,9A2,2 0 0,1 10,11A2,2 0 0,1 8,13M12,13A2,2 0 0,1 10,11A2,2 0 0,1 12,9A2,2 0 0,1 14,11A2,2 0 0,1 12,13M16,13A2,2 0 0,1 14,11A2,2 0 0,1 16,9A2,2 0 0,1 18,11A2,2 0 0,1 16,13Z"/>
                    </svg>
                    Asistente ESPE
                </h3>
                <button class="chatbot-close" onclick="window.chatbot.toggleChat()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                    </svg>
                </button>
            </div>
            <div class="chatbot-messages" id="chatbot-messages"></div>
            <div class="chatbot-input-area">
                <textarea 
                    class="chatbot-input" 
                    id="chatbot-input" 
                    placeholder="Pregúntame sobre evacuación volcánica..." 
                    rows="1"
                ></textarea>
                <button class="chatbot-send" id="chatbot-send" onclick="window.chatbot.sendMessage()">
                    <svg viewBox="0 0 24 24">
                        <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
                    </svg>
                </button>
            </div>
        `;
        document.body.appendChild(chatContainer);

        this.floatBtn = floatBtn;
        this.container = chatContainer;
        this.messagesContainer = document.getElementById('chatbot-messages');
        this.input = document.getElementById('chatbot-input');
        this.sendBtn = document.getElementById('chatbot-send');
        
        console.log('✅ Elementos del chatbot creados');
    }

    attachEventListeners() {
        // Auto-resize del textarea
        this.input.addEventListener('input', () => {
            this.input.style.height = 'auto';
            this.input.style.height = Math.min(this.input.scrollHeight, 100) + 'px';
        });

        // Enviar con Enter
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Detectar typing
        this.input.addEventListener('input', () => {
            const hasText = this.input.value.trim().length > 0;
            this.sendBtn.disabled = !hasText;
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            this.container.classList.remove('hidden');
            this.container.classList.add('visible');
            setTimeout(() => this.input.focus(), 100);
            this.hideBadge();
        } else {
            this.container.classList.remove('visible');
            this.container.classList.add('hidden');
        }
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message || this.isTyping) return;

        // Agregar mensaje del usuario
        this.addMessage('user', message);
        this.input.value = '';
        this.input.style.height = 'auto';
        this.sendBtn.disabled = true;

        // Mostrar indicador de typing
        this.showTyping();

        try {
            // Usar el sistema híbrido del ResponseManager
            const response = await this.responseManager.processQuery(message);
            
            // Ocultar typing y mostrar respuesta
            setTimeout(() => {
                this.hideTyping();
                this.addMessage('bot', response.response, response);
                this.showQuickSuggestions();
            }, 1000);
            
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            this.hideTyping();
            this.addMessage('bot', '❌ Lo siento, hubo un error. Por favor intenta de nuevo.');
        }
    }

    addMessage(sender, content, metadata = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">${this.formatMessage(content)}</div>
                <div class="message-avatar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                    </svg>
                </div>
            `;
        } else {
            const confidence = metadata ? `<span class="confidence">Confianza: ${(metadata.confidence * 100).toFixed(0)}%</span>` : '';
            
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,3C6.5,3 2,6.58 2,11A7.18,7.18 0 0,0 2.64,14.34L1.42,18.05C1.13,18.89 1.78,19.7 2.66,19.54L6.84,18.96C8.28,19.61 10.1,20 12,20C17.5,20 22,16.42 22,11C22,6.58 17.5,3 12,3M8,13A2,2 0 0,1 6,11A2,2 0 0,1 8,9A2,2 0 0,1 10,11A2,2 0 0,1 8,13M12,13A2,2 0 0,1 10,11A2,2 0 0,1 12,9A2,2 0 0,1 14,11A2,2 0 0,1 12,13M16,13A2,2 0 0,1 14,11A2,2 0 0,1 16,9A2,2 0 0,1 18,11A2,2 0 0,1 16,13Z"/>
                    </svg>
                </div>
                <div class="message-content">
                    <div class="bot-name">Asistente ESPE</div>
                    <div class="message-text">${this.formatMessage(content)}</div>
                    <div class="message-footer">
                        <span class="message-time">${this.getTimestamp()}</span>
                        ${confidence}
                    </div>
                </div>
            `;
        }
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        this.messages.push({ sender, content, timestamp: new Date() });
    }

    // Función para formatear mensajes con markdown básico
    formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '• ');
    }

    getTimestamp() {
        return new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showTyping() {
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing';
        typingDiv.id = 'typing-indicator';
        
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,3C6.5,3 2,6.58 2,11A7.18,7.18 0 0,0 2.64,14.34L1.42,18.05C1.13,18.89 1.78,19.7 2.66,19.54L6.84,18.96C8.28,19.61 10.1,20 12,20C17.5,20 22,16.42 22,11C22,6.58 17.5,3 12,3M8,13A2,2 0 0,1 6,11A2,2 0 0,1 8,9A2,2 0 0,1 10,11A2,2 0 0,1 8,13M12,13A2,2 0 0,1 10,11A2,2 0 0,1 12,9A2,2 0 0,1 14,11A2,2 0 0,1 12,13M16,13A2,2 0 0,1 14,11A2,2 0 0,1 16,9A2,2 0 0,1 18,11A2,2 0 0,1 16,13Z"/>
                </svg>
            </div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    showQuickSuggestions() {
        // Remover sugerencias anteriores
        const oldSuggestions = this.messagesContainer.querySelector('.quick-suggestions');
        if (oldSuggestions) {
            oldSuggestions.remove();
        }

        const suggestions = [
            "¿Cómo preparar un kit de emergencia volcánica?",
            "¿Zonas seguras ante explosion del volcan?",
            "¿Qué hacer durante una erupción del Cotopaxi?"
        ];

        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'quick-suggestions';
        
        suggestions.forEach(suggestion => {
            const chip = document.createElement('button');
            chip.className = 'suggestion-chip';
            chip.textContent = suggestion;
            chip.onclick = () => {
                this.input.value = suggestion;
                this.sendMessage();
                suggestionsDiv.remove();
            };
            suggestionsDiv.appendChild(chip);
        });
        
        this.messagesContainer.appendChild(suggestionsDiv);
        this.scrollToBottom();
    }

    getCurrentContext() {
        const context = {};
        
        // Obtener ubicación actual si está disponible
        if (window.ubicacionActual) {
            context.location = `${window.ubicacionActual.lat}, ${window.ubicacionActual.lng}`;
        }
        
        // Obtener ruta actual si existe
        if (window.rutaActual) {
            context.currentRoute = window.rutaActual.summary || 'Ruta calculada';
        }
        
        // Obtener zonas seguras
        if (window.zonasSeguras) {
            context.safeZones = window.zonasSeguras.map(zona => zona.properties.nombre);
        }
        
        return context;
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showBadge() {
        const badge = document.getElementById('chatbot-badge');
        if (badge) {
            badge.style.display = 'flex';
        }
    }

    hideBadge() {
        const badge = document.getElementById('chatbot-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }

    // Método para mostrar notificaciones desde el sistema principal
    showNotification(message) {
        if (!this.isOpen) {
            this.showBadge();
        }
        this.addMessage('bot', message);
    }

    // Método para integrar con el sistema de rutas
    onRouteCalculated(routeData) {
        const message = `🗺️ He calculado una nueva ruta para ti:

**Distancia:** ${routeData.distance}km
**Tiempo estimado:** ${routeData.duration} minutos

¿Necesitas más información sobre esta ruta?`;
        this.showNotification(message);
    }

    // Método para alertas de emergencia
    onEmergencyAlert(alertType) {
        const emergencyMessages = {
            volcanic: '🚨 **ALERTA VOLCÁNICA:** Se ha activado el protocolo de evacuación. Dirígete inmediatamente a la zona segura más cercana.',
            route_blocked: '⚠️ La ruta actual está bloqueada. Calculando ruta alternativa...',
            safe_zone_reached: '✅ Has llegado a una zona segura. Mantente en esta área hasta recibir nuevas instrucciones.'
        };
        
        const message = emergencyMessages[alertType] || 'Se ha detectado una situación que requiere tu atención.';
        this.showNotification(message);
    }
}

// Inicializar chatbot cuando la página esté lista
window.chatbot = new Chatbot();