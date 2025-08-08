/* filepath: js/chatbot/gemini-api.js */
class GeminiAPI {
    constructor() {
        this.config = null;
        this.isInitialized = false;
        this.apiKey = null;
        this.apiUrl = null;
        this.requestCount = 0;
    }

    async init() {
        try {
            console.log('🤖 Inicializando Gemini API...');
            
            // Cargar configuración
            const response = await fetch('data/chatbot/gemini-config.json');
            this.config = await response.json();
            
            this.apiKey = this.config.apiKey;
            this.apiUrl = this.config.apiUrl;
            
            if (!this.apiKey) {
                throw new Error('API Key no encontrada');
            }
            
            this.isInitialized = true;
            console.log('✅ Gemini API inicializada correctamente');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando Gemini:', error);
            this.isInitialized = false;
            return false;
        }
    }

    async sendMessage(userMessage) {
        if (!this.isInitialized) {
            throw new Error('Gemini API no inicializada');
        }

        try {
            this.requestCount++;
            console.log(`🚀 Enviando mensaje a Gemini (#${this.requestCount})`);
            
            const systemPrompt = this.config.systemPrompt || 
                "Eres un experto en prevención volcánica del Cotopaxi de la Universidad ESPE.";
            
            const fullPrompt = `${systemPrompt}

CONSULTA DEL USUARIO: "${userMessage}"

Responde de manera específica, práctica y educativa sobre prevención volcánica. Máximo 300 palabras.`;

            const requestBody = {
                contents: [{
                    parts: [{
                        text: fullPrompt
                    }]
                }],
                generationConfig: {
                    temperature: this.config.temperature || 0.4,
                    maxOutputTokens: this.config.maxTokens || 1000,
                    topP: 0.8,
                    topK: 40
                }
            };

            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('❌ Error HTTP Gemini:', response.status, errorData);
                throw new Error(`HTTP ${response.status}: ${errorData}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                console.error('❌ Respuesta inválida de Gemini:', data);
                throw new Error('Respuesta inválida de Gemini');
            }

            const aiResponse = data.candidates[0].content.parts[0].text;
            console.log('✅ Respuesta Gemini recibida exitosamente');
            
            return aiResponse.trim();

        } catch (error) {
            console.error('❌ Error en sendMessage:', error);
            throw error;
        }
    }

    isAvailable() {
        return this.isInitialized && this.apiKey && this.apiUrl;
    }

    getStats() {
        return {
            initialized: this.isInitialized,
            requestCount: this.requestCount,
            hasApiKey: !!this.apiKey,
            hasApiUrl: !!this.apiUrl
        };
    }
}

// Exportar globalmente
window.GeminiAPI = GeminiAPI;