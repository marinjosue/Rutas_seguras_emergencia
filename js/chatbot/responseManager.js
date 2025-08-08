/* filepath: js/chatbot/responseManager.js */
class ResponseManager {
    constructor() {
        this.corpusNLP = new CorpusNLP();
        this.responses = null;
        this.geminiAPI = null;
        
        this.volcanicKeywords = [
            'volcan', 'volcán', 'cotopaxi', 'erupcion', 'ceniza', 'emergencia',
            'evacuacion', 'kit', 'familia', 'madre', 'padre', 'casa', 'vivo',
            'latacunga', 'quito', 'sangolqui', 'machachi', 'espe', 'riesgo',
            'cerca', 'rio', 'peligro', 'segura', 'zona', 'conocoto'
        ];

        this.stats = {
            gemini_responses: 0,
            corpus_responses: 0,
            json_responses: 0,
            total_queries: 0
        };
    }

    async init() {
        console.log('🤖 Inicializando ResponseManager...');
        
        // 1. Inicializar Gemini
        try {
            this.geminiAPI = new GeminiAPI();
            await this.geminiAPI.init();
            console.log('✅ Gemini API listo');
        } catch (error) {
            console.warn('⚠️ Gemini no disponible:', error);
        }
        
        // 2. Cargar Corpus
        try {
            await this.corpusNLP.loadCorpus();
            console.log('✅ Corpus NLP cargado');
        } catch (error) {
            console.warn('⚠️ Corpus no disponible');
        }
        
        // 3. Cargar JSON responses
        try {
            const response = await fetch('data/chatbot/chatbot-responses.json');
            const data = await response.json();
            this.responses = data.responses;
            console.log('✅ JSON responses cargado');
        } catch (error) {
            console.error('❌ Error cargando JSON responses:', error);
        }
        
        return true;
    }

    async processQuery(userMessage) {
        this.stats.total_queries++;
        console.log(`🔍 Procesando: "${userMessage}"`);
        
        // PASO 1: Verificar si es volcánico
        if (!this.isVolcanicQuery(userMessage)) {
            return this.handleNonVolcanicQuery();
        }

        // PASO 2: Intentar con Gemini PRIMERO
        if (this.geminiAPI && this.geminiAPI.isAvailable()) {
            try {
                console.log('🤖 Usando Gemini AI...');
                const prompt = this.createContextualPrompt(userMessage);
                const aiResponse = await this.geminiAPI.sendMessage(prompt);
                
                this.stats.gemini_responses++;
                
                return {
                    response: this.enhanceResponse(aiResponse, userMessage),
                    intent: 'ai_intelligent',
                    confidence: 0.95,
                    method: 'gemini_ai'
                };
                
            } catch (error) {
                console.warn('⚠️ Gemini falló, intentando corpus...', error);
            }
        }

        // PASO 3: Fallback a Corpus + JSON
        return this.getCorpusOrJsonResponse(userMessage);
    }

    isVolcanicQuery(message) {
        const clean = message.toLowerCase();
        
        // Detectar palabras clave
        const hasKeywords = this.volcanicKeywords.some(keyword => clean.includes(keyword));
        
        // Detectar ubicaciones
        const locations = ['latacunga', 'quito', 'sangolqui', 'machachi', 'conocoto', 'valle'];
        const hasLocation = locations.some(loc => clean.includes(loc));
        
        // Detectar consultas familiares
        const personal = ['mi madre', 'mi padre', 'mi familia', 'vivo en', 'mi casa'];
        const hasPersonal = personal.some(p => clean.includes(p));
        
        const isVolcanic = hasKeywords || hasLocation || hasPersonal;
        
        console.log(`📊 Análisis volcánico: ${isVolcanic} (keywords: ${hasKeywords}, location: ${hasLocation}, personal: ${hasPersonal})`);
        
        return isVolcanic;
    }

    createContextualPrompt(userMessage) {
        let context = '';
        
        // Detectar ubicación específica
        const clean = userMessage.toLowerCase();
        if (clean.includes('latacunga')) {
            context += `\nUBICACIÓN: Latacunga está en ZONA DE ALTO RIESGO por lahares del Cotopaxi. Los ríos Cutuchi y Pumacunchi transportan lahares. Tiempo de llegada: 20-30 minutos.`;
        }
        if (clean.includes('conocoto')) {
            context += `\nUBICACIÓN: Conocoto está en el Valle de Los Chillos, zona de riesgo ALTO por lahares del río Pita.`;
        }
        if (clean.includes('sangolqui')) {
            context += `\nUBICACIÓN: Sangolquí está en el Valle de Los Chillos, zona de ALTO RIESGO por lahares.`;
        }
        
        // Detectar consultas familiares
        if (clean.includes('madre') || clean.includes('padre') || clean.includes('familia')) {
            context += `\nCONSULTA FAMILIAR: Evalúa el riesgo personal y da recomendaciones específicas de seguridad.`;
        }
        
        const prompt = `Eres un EXPERTO en prevención volcánica del VOLCÁN COTOPAXI de la Universidad ESPE de Ecuador.

INFORMACIÓN DEL COTOPAXI:
- Volcán activo a 60 km de Quito
- Altura: 5,897 metros
- Última erupción: 2015
- Población en riesgo: 300,000+ personas

ZONAS DE RIESGO:
🔴 ALTO: Latacunga, Sangolquí, Valle de Los Chillos, Machachi
🟡 MEDIO: Sur de Quito, Mejía, Rumiñahui
🟢 BAJO: Norte de Quito, zonas altas

AMENAZAS:
- Lahares (flujos de lodo volcánico por ríos)
- Ceniza volcánica (problemas respiratorios)
- Flujos piroclásticos (extremadamente peligrosos)
- Gases volcánicos (tóxicos)${context}

CONSULTA: "${userMessage}"

INSTRUCCIONES:
1. Responde específicamente a la consulta
2. Incluye información práctica de seguridad
3. Usa un tono profesional pero comprensible
4. Máximo 250 palabras
5. Incluye emojis apropiados

Responde como experto:`;

        return prompt;
    }

    enhanceResponse(aiResponse, userMessage) {
        let enhanced = aiResponse;
        
        // Añadir números de emergencia si es urgente
        if (this.detectUrgency(userMessage)) {
            enhanced += `\n\n🚨 EMERGENCIA: 911 • IGEPN: (02) 2225-066`;
        }
        
        // Añadir fuente
        enhanced += `\n\n📋 Fuente: Instituto Geofísico ESPE (IGEPN)`;
        
        return enhanced;
    }

    detectUrgency(message) {
        const urgent = ['urgente', 'peligro', 'ayuda', 'socorro', 'rápido'];
        return urgent.some(u => message.toLowerCase().includes(u));
    }

    async getCorpusOrJsonResponse(userMessage) {
        // Intentar corpus primero
        try {
            const corpusResult = this.corpusNLP.analyzeIntent(userMessage);
            if (corpusResult && corpusResult.intent && this.responses[corpusResult.intent]) {
                this.stats.corpus_responses++;
                return {
                    response: this.responses[corpusResult.intent].response,
                    intent: corpusResult.intent,
                    confidence: 0.8,
                    method: 'corpus_nlp'
                };
            }
        } catch (error) {
            console.warn('Corpus no disponible');
        }

        // Fallback a JSON directo
        this.stats.json_responses++;
        return {
            response: this.responses?.default?.response || 
                "🌋 Soy especialista en prevención volcánica del Cotopaxi. Reformula tu pregunta para ayudarte mejor.",
            intent: 'default',
            confidence: 0.6,
            method: 'json_fallback'
        };
    }

    processQuickMessage(intent) {
        this.stats.total_queries++;
        
        if (this.responses && this.responses[intent]) {
            return {
                response: this.responses[intent].response,
                intent: intent,
                confidence: 1.0,
                method: 'direct_button'
            };
        }

        return {
            response: "Error procesando solicitud predefinida",
            intent: 'error',
            confidence: 0,
            method: 'error'
        };
    }

    handleNonVolcanicQuery() {
        return {
            response: `🌋 Soy especialista en **prevención volcánica del Cotopaxi**.

Mi expertise incluye:
• 🏠 Evaluación de riesgo por ubicación
• 👨‍👩‍👧‍👦 Planes de seguridad familiar  
• 📦 Kits de emergencia volcánica
• 🗺️ Rutas de evacuación
• 🚨 Procedimientos durante erupciones

**¿Tienes alguna consulta sobre el Volcán Cotopaxi?**

Ejemplos:
• "Mi familia vive en X lugar, ¿están seguros?"
• "¿Qué hacer si hay caída de ceniza?"
• "¿Cómo evacuar desde mi ubicación?"`,
            intent: 'domain_redirect',
            confidence: 1.0,
            method: 'domain_filter'
        };
    }

    getStats() {
        const total = this.stats.total_queries;
        if (total === 0) return { message: 'Sin consultas procesadas' };

        return {
            total_queries: total,
            gemini_usage: `${((this.stats.gemini_responses / total) * 100).toFixed(1)}%`,
            corpus_usage: `${((this.stats.corpus_responses / total) * 100).toFixed(1)}%`,
            json_usage: `${((this.stats.json_responses / total) * 100).toFixed(1)}%`,
            components: {
                gemini: this.geminiAPI?.isAvailable() || false,
                corpus: !!this.corpusNLP,
                json: !!this.responses
            }
        };
    }
}

window.ResponseManager = ResponseManager;