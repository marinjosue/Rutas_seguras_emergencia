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
            'cerca', 'rio', 'peligro', 'segura', 'zona', 'conocoto', 'bloque g', 'bloque h'
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
        
        // PASO 1: Verificar consultas específicas de bloques (MÁXIMA PRIORIDAD)
        const bloqueResponse = this.processBloqueQuery(userMessage);
        if (bloqueResponse) {
            return bloqueResponse;
        }

        // PASO 2: Verificar si es volcánico
        if (!this.isVolcanicQuery(userMessage)) {
            return this.handleNonVolcanicQuery();
        }

        // PASO 3: Intentar con Gemini PRIMERO
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

        // PASO 4: Fallback a Corpus + JSON
        return this.getCorpusOrJsonResponse(userMessage);
    }

    // NUEVA función unificada para procesar consultas de bloques
    processBloqueQuery(message) {
        const clean = message.toLowerCase();
        
        // BLOQUE G - Máxima prioridad
        if (this.isBloqueGQuery(clean)) {
            return this.getBloqueGResponse(clean);
        }
        
        // BLOQUE H - Segunda prioridad
        if (this.isBloqueHQuery(clean)) {
            return this.getBloqueHResponse(clean);
        }
        
        return null;
    }

    // Detectar consultas específicas del Bloque G
    isBloqueGQuery(cleanMessage) {
        const bloqueGKeywords = [
            'bloque g', 'edificio g', 'evacuacion bloque g', 'evacuar bloque g',
            'ruta bloque g', 'emergencia bloque g', 'salir bloque g',
            'protocolo bloque g', 'estoy en bloque g', 'desde bloque g',
            'protocolo completo bloque g', 'que hago si estoy en bloque g',
            'ruta especifica bloque g'
        ];
        
        return bloqueGKeywords.some(keyword => cleanMessage.includes(keyword));
    }

    // Detectar consultas específicas del Bloque H
    isBloqueHQuery(cleanMessage) {
        const bloqueHKeywords = [
            'bloque h', 'edificio h', 'evacuacion bloque h', 'evacuar bloque h',
            'ruta bloque h', 'emergencia bloque h', 'salir bloque h',
            'protocolo bloque h', 'estoy en bloque h', 'desde bloque h',
            'protocolo completo bloque h', 'que hago si estoy en bloque h',
            'ruta especifica bloque h'
        ];
        
        return bloqueHKeywords.some(keyword => cleanMessage.includes(keyword));
    }

    // Respuesta específica para Bloque G con diferentes tipos
    getBloqueGResponse(cleanMessage) {
        this.stats.json_responses++;
        
        // Protocolo completo
        if (cleanMessage.includes('protocolo completo')) {
            return {
                response: this.getBloqueGProtocoloCompleto(),
                intent: 'evacuacion_bloque_g_completo',
                confidence: 0.98,
                method: 'bloque_g_protocolo_completo'
            };
        }
        
        // Qué hago si estoy
        if (cleanMessage.includes('que hago si estoy') || cleanMessage.includes('estoy en bloque g')) {
            return {
                response: this.getBloqueGQueHago(),
                intent: 'evacuacion_bloque_g_que_hago',
                confidence: 0.98,
                method: 'bloque_g_que_hago'
            };
        }
        
        // Ruta específica
        if (cleanMessage.includes('ruta especifica') || cleanMessage.includes('ruta específica')) {
            return {
                response: this.getBloqueGRutaEspecifica(),
                intent: 'evacuacion_bloque_g_ruta',
                confidence: 0.98,
                method: 'bloque_g_ruta_especifica'
            };
        }
        
        // Respuesta general por defecto
        return {
            response: this.responses?.evacuacion_bloque_g?.response || this.getBloqueGProtocoloCompleto(),
            intent: 'evacuacion_bloque_g',
            confidence: 0.98,
            method: 'bloque_g_general'
        };
    }

    // Respuesta específica para Bloque H con diferentes tipos
    getBloqueHResponse(cleanMessage) {
        this.stats.json_responses++;
        
        // Protocolo completo
        if (cleanMessage.includes('protocolo completo')) {
            return {
                response: this.getBloqueHProtocoloCompleto(),
                intent: 'evacuacion_bloque_h_completo',
                confidence: 0.98,
                method: 'bloque_h_protocolo_completo'
            };
        }
        
        // Qué hago si estoy
        if (cleanMessage.includes('que hago si estoy') || cleanMessage.includes('estoy en bloque h')) {
            return {
                response: this.getBloqueHQueHago(),
                intent: 'evacuacion_bloque_h_que_hago',
                confidence: 0.98,
                method: 'bloque_h_que_hago'
            };
        }
        
        // Ruta específica
        if (cleanMessage.includes('ruta especifica') || cleanMessage.includes('ruta específica')) {
            return {
                response: this.getBloqueHRutaEspecifica(),
                intent: 'evacuacion_bloque_h_ruta',
                confidence: 0.98,
                method: 'bloque_h_ruta_especifica'
            };
        }
        
        // Respuesta general por defecto
        return {
            response: this.getBloqueHProtocoloCompleto(),
            intent: 'evacuacion_bloque_h',
            confidence: 0.98,
            method: 'bloque_h_general'
        };
    }

    // =================== RESPUESTAS DETALLADAS BLOQUE G ===================

    getBloqueGProtocoloCompleto() {
        return `🚨 **PROTOCOLO COMPLETO DE EVACUACIÓN BLOQUE G - ESPE**

📋 **INFORMACIÓN GENERAL:**
• **Edificio:** Bloque G - 3 pisos
• **Ubicación:** Campus ESPE Sangolquí
• **Capacidad:** 200+ personas
• **Tiempo crítico:** 2-3 minutos máximo

📍 **INSTRUCCIONES PASO A PASO:**

**1️⃣ SALIDA DEL AULA**
• Mantén la calma, no corras
• Deja todo y sal inmediatamente
• Ayuda a compañeros si es necesario
• Cierra la puerta del aula sin llave

**2️⃣ EN EL PASILLO**
• Gira a mano DERECHA al salir del aula
• Camina por el lado derecho del pasillo
• NO uses el ascensor bajo ninguna circunstancia
• Mantén distancia de 1 metro entre personas

**3️⃣ DIRÍGETE A LAS GRADAS**
• Camina 10 metros hasta encontrar las gradas
• Las gradas están marcadas con señalización verde
• Prioridad: embarazadas, personas con discapacidad
• Mantén el orden, no empujes

**4️⃣ DESCENSO PISO 3 → PISO 2**
• Baja por las gradas principales
• Agárrate del pasamanos
• Un paso a la vez, sin saltar escalones
• Permite que otros bajen a tu izquierda si es urgente

**5️⃣ DESCENSO PISO 2 → PISO 1**
• Continúa bajando hasta la planta baja
• Mantén el orden y la calma
• Sigue las instrucciones del personal de seguridad
• NO te detengas en los pisos intermedios

**6️⃣ SALIDA DEL EDIFICIO**
• Camina 20 metros hacia la salida trasera
• Sal por la puerta de emergencia principal
• NO te detengas en la salida
• Continúa alejándote del edificio

**7️⃣ PUNTO DE ENCUENTRO**
• Dirígete al área verde (punto seguro)
• Aléjate al menos 100 metros del edificio
• Reporta tu presencia al coordinador de evacuación
• Permanece en el área hasta recibir instrucciones

**⏱️ TIEMPOS ESTIMADOS:**
• Aula → Gradas: 30 segundos
• Descenso completo: 90 segundos
• Salida edificio: 30 segundos
• **TOTAL: 2-3 minutos**

**📏 DISTANCIAS:**
• Recorrido total: 85 metros
• Gradas: 25 metros verticales
• Salida: 20 metros horizontales

**⚠️ PROHIBICIONES ESTRICTAS:**
🚫 NO uses ascensores
🚫 NO regreses por pertenencias
🚫 NO corras (riesgo de caídas)
🚫 NO bloquees salidas
🚫 NO uses teléfono durante evacuación

**📋 RESPONSABILIDADES:**
• **Docentes:** Guiar estudiantes y verificar aulas
• **Estudiantes:** Seguir instrucciones y ayudar compañeros
• **Personal:** Coordinar evacuación y puntos de encuentro

**📞 CONTACTOS DE EMERGENCIA:**
• Seguridad ESPE: 911
• Cruz Roja: 171
• Bomberos: 101`;
    }

    getBloqueGQueHago() {
        return `🚨 **¿ESTÁS EN EL BLOQUE G? MANTÉN LA CALMA**

🫁 **RESPIRA PROFUNDO** - La evacuación es segura y controlada

**🎯 ACCIONES INMEDIATAS:**

**PASO 1: MENTAL (5 segundos)**
• Mantén la calma, no entres en pánico
• Evalúa tu ubicación actual
• Identifica a las personas cerca de ti

**PASO 2: PREPARACIÓN (10 segundos)**
• Deja todo lo que tengas en las manos
• Ayuda a la persona más cercana si necesita apoyo
• Dirígete hacia la puerta del aula

**PASO 3: MOVIMIENTO (30 segundos)**
• Sal del aula y gira a la DERECHA
• Camina con paso firme pero sin correr
• Mantén distancia con la persona de adelante

**PASO 4: ESCALERAS (90 segundos)**
• Localiza las gradas (10 metros del aula)
• Baja paso a paso, agárrate del pasamanos
• NO saltes escalones, mantén equilibrio

**PASO 5: SALIDA (30 segundos)**
• Una vez en planta baja, camina hacia salida trasera
• Sal del edificio por la puerta principal
• Continúa alejándote hasta el punto seguro

**🧘‍♂️ TÉCNICAS DE CALMA:**
• Cuenta: "1, 2, 3" mientras caminas
• Respira: Inhala 3 segundos, exhala 3 segundos
• Enfoque: Concéntrate solo en el siguiente paso

**👥 AYUDA A OTROS:**
• Persona con pánico: "Vamos juntos, respira"
• Persona con movilidad limitada: Ofrece tu brazo
• Niños: Mantén contacto visual y sonríe

**⏰ RECUERDA:** Tienes 2-3 minutos para evacuar de forma segura

**🎯 TU OBJETIVO:** Área verde (punto seguro) - 100 metros del edificio

**💪 PUEDES HACERLO:** Miles de personas han evacuado exitosamente siguiendo estos pasos`;
    }

    getBloqueGRutaEspecifica() {
        return `🗺️ **RUTA ESPECÍFICA DETALLADA - BLOQUE G**

**📍 COORDENADAS DE REFERENCIA:**
• Inicio: Bloque G, Piso 3
• Destino: Área verde (Punto seguro)
• Distancia total: 85 metros

**🛤️ RECORRIDO PASO A PASO:**

**TRAMO 1: AULA → PASILLO (5 metros)**
• Dirección: Este
• Tiempo: 15 segundos
• Superficie: Piso cerámico antideslizante

**TRAMO 2: PASILLO → GRADAS (10 metros)**
• Dirección: Norte (gira derecha)
• Tiempo: 30 segundos
• Referencia: Seguir señalización verde "SALIDA"

**TRAMO 3: GRADAS PISO 3 → PISO 2 (25 escalones)**
• Dirección: Descenso
• Tiempo: 45 segundos
• Pasamanos: Lado derecho obligatorio
• Altura: 3.5 metros de descenso

**TRAMO 4: GRADAS PISO 2 → PISO 1 (25 escalones)**
• Dirección: Continuar descenso
• Tiempo: 45 segundos
• Ancho: 2.5 metros (caben 3 personas)
• Material: Concreto con antideslizante

**TRAMO 5: PLANTA BAJA → SALIDA TRASERA (20 metros)**
• Dirección: Oeste hacia salida trasera
• Tiempo: 30 segundos
• Puertas: Doble puerta automática (empujar)

**TRAMO 6: EDIFICIO → PUNTO SEGURO (50 metros)**
• Dirección: Sur hacia área verde
• Tiempo: 60 segundos
• Superficie: Adoquín y césped
• Destino: Área sombreada bajo árboles

**🧭 REFERENCIAS VISUALES:**
• **Señalización:** Flechas verdes en paredes
• **Iluminación:** Luces de emergencia LED
• **Piso:** Líneas amarillas hacia salidas
• **Punto seguro:** Bancos de concreto bajo árboles

**📐 DETALLES TÉCNICOS:**
• Pendiente escaleras: 30°
• Ancho pasillos: 3 metros
• Altura techos: 3 metros
• Capacidad gradas: 4 personas por fila

**🚨 PUNTOS CRÍTICOS:**
• **Escaleras:** Mayor riesgo de aglomeración
• **Salida trasera:** Cuello de botella posible
• **Área verde:** Verificar llegada con coordinador

**💡 TIPS DE NAVEGACIÓN:**
• Mantén la derecha en todo momento
• Si hay humo, mantente agachado
• Sigue a la persona de adelante si hay poca visibilidad
• Cuenta pasos para mantener concentración

**📱 UNA VEZ SEGURO:**
• Confirma tu ubicación con coordinador
• Ayuda a contar personas evacuadas
• Permanece en área asignada hasta nueva instrucción`;
    }

    // =================== RESPUESTAS DETALLADAS BLOQUE H ===================

    getBloqueHProtocoloCompleto() {
        return `🚨 **PROTOCOLO COMPLETO DE EVACUACIÓN BLOQUE H - ESPE**

📋 **INFORMACIÓN GENERAL:**
• **Edificio:** Bloque H - 3 pisos
• **Ubicación:** Campus ESPE Sangolquí
• **Capacidad:** 180+ personas
• **Tiempo crítico:** 3-4 minutos máximo

📍 **INSTRUCCIONES PASO A PASO:**

**1️⃣ SALIDA DEL AULA**
• Mantén la calma, no corras
• Deja todo y sal inmediatamente
• Ayuda a compañeros si es necesario
• Cierra la puerta del aula sin llave

**2️⃣ EN EL PASILLO**
• Gira a mano IZQUIERDA al salir del aula
• Camina por el lado derecho del pasillo
• NO uses el ascensor bajo ninguna circunstancia
• Mantén distancia de 1 metro entre personas

**3️⃣ DIRÍGETE A LAS GRADAS**
• Camina 20 metros hasta encontrar las gradas norte
• Las gradas están marcadas con señalización verde
• Prioridad: embarazadas, personas con discapacidad
• Mantén el orden, no empujes

**4️⃣ DESCENSO PISO 3 → PISO 2**
• Baja por las gradas principales
• Agárrate del pasamanos
• Un paso a la vez, sin saltar escalones
• Permite que otros bajen a tu izquierda si es urgente

**5️⃣ DESCENSO PISO 2 → PISO 1**
• Continúa bajando hasta la planta baja
• Mantén el orden y la calma
• Sigue las instrucciones del personal de seguridad
• NO te detengas en los pisos intermedios

**6️⃣ SALIDA DEL EDIFICIO**
• Camina 25 metros hacia el patio central
• Sal por la puerta de emergencia norte
• NO te detengas en la salida
• Continúa alejándote del edificio

**7️⃣ PUNTO DE ENCUENTRO**
• Dirígete a la zona verde norte (patio central)
• Aléjate al menos 100 metros del edificio
• Reporta tu presencia al coordinador de evacuación
• Permanece en el área hasta recibir instrucciones

**⏱️ TIEMPOS ESTIMADOS:**
• Aula → Gradas: 45 segundos
• Descenso completo: 120 segundos
• Salida edificio: 45 segundos
• **TOTAL: 3-4 minutos**

**📏 DISTANCIAS:**
• Recorrido total: 120 metros
• Gradas: 25 metros verticales
• Salida: 25 metros horizontales

**⚠️ PROHIBICIONES ESTRICTAS:**
🚫 NO uses ascensores
🚫 NO regreses por pertenencias
🚫 NO corras (riesgo de caídas)
🚫 NO bloquees salidas
🚫 NO uses teléfono durante evacuación

**📋 RESPONSABILIDADES:**
• **Docentes:** Guiar estudiantes y verificar aulas
• **Estudiantes:** Seguir instrucciones y ayudar compañeros
• **Personal:** Coordinar evacuación y puntos de encuentro

**📞 CONTACTOS DE EMERGENCIA:**
• Seguridad ESPE: 911
• Cruz Roja: 171
• Bomberos: 101`;
    }

    getBloqueHQueHago() {
        return `🚨 **¿ESTÁS EN EL BLOQUE H? MANTÉN LA CALMA**

🫁 **RESPIRA PROFUNDO** - La evacuación es segura y controlada

**🎯 ACCIONES INMEDIATAS:**

**PASO 1: MENTAL (5 segundos)**
• Mantén la calma, no entres en pánico
• Evalúa tu ubicación actual
• Identifica a las personas cerca de ti

**PASO 2: PREPARACIÓN (10 segundos)**
• Deja todo lo que tengas en las manos
• Ayuda a la persona más cercana si necesita apoyo
• Dirígete hacia la puerta del aula

**PASO 3: MOVIMIENTO (45 segundos)**
• Sal del aula y gira a la IZQUIERDA
• Camina con paso firme pero sin correr
• Mantén distancia con la persona de adelante

**PASO 4: ESCALERAS (120 segundos)**
• Localiza las gradas norte (20 metros del aula)
• Baja paso a paso, agárrate del pasamanos
• NO saltes escalones, mantén equilibrio

**PASO 5: SALIDA (45 segundos)**
• Una vez en planta baja, camina hacia patio central
• Sal del edificio por la puerta norte
• Continúa alejándote hasta el punto seguro

**🧘‍♂️ TÉCNICAS DE CALMA:**
• Cuenta: "1, 2, 3, 4" mientras caminas
• Respira: Inhala 4 segundos, exhala 4 segundos
• Enfoque: Concéntrate solo en el siguiente paso

**👥 AYUDA A OTROS:**
• Persona con pánico: "Vamos juntos, respira"
• Persona con movilidad limitada: Ofrece tu brazo
• Niños: Mantén contacto visual y sonríe

**⏰ RECUERDA:** Tienes 3-4 minutos para evacuar de forma segura

**🎯 TU OBJETIVO:** Patio central (punto seguro) - 100 metros del edificio

**💪 PUEDES HACERLO:** Miles de personas han evacuado exitosamente siguiendo estos pasos`;
    }

    getBloqueHRutaEspecifica() {
        return `🗺️ **RUTA ESPECÍFICA DETALLADA - BLOQUE H**

**📍 COORDENADAS DE REFERENCIA:**
• Inicio: Bloque H, Piso 3
• Destino: Patio central (Punto seguro)
• Distancia total: 120 metros

**🛤️ RECORRIDO PASO A PASO:**

**TRAMO 1: AULA → PASILLO (5 metros)**
• Dirección: Oeste
• Tiempo: 15 segundos
• Superficie: Piso cerámico antideslizante

**TRAMO 2: PASILLO → GRADAS (20 metros)**
• Dirección: Norte (gira izquierda)
• Tiempo: 60 segundos
• Referencia: Seguir señalización verde "SALIDA"

**TRAMO 3: GRADAS PISO 3 → PISO 2 (25 escalones)**
• Dirección: Descenso
• Tiempo: 60 segundos
• Pasamanos: Lado derecho obligatorio
• Altura: 3.5 metros de descenso

**TRAMO 4: GRADAS PISO 2 → PISO 1 (25 escalones)**
• Dirección: Continuar descenso
• Tiempo: 60 segundos
• Ancho: 2.2 metros (caben 2 personas)
• Material: Concreto con antideslizante

**TRAMO 5: PLANTA BAJA → PATIO CENTRAL (25 metros)**
• Dirección: Norte hacia patio central
• Tiempo: 45 segundos
• Puertas: Puerta doble (empujar hacia afuera)

**TRAMO 6: EDIFICIO → PUNTO SEGURO (45 metros)**
• Dirección: Centro del patio
• Tiempo: 75 segundos
• Superficie: Adoquín y área verde
• Destino: Zona sombreada central

**🧭 REFERENCIAS VISUALES:**
• **Señalización:** Flechas verdes en paredes
• **Iluminación:** Luces de emergencia LED
• **Piso:** Líneas amarillas hacia salidas
• **Punto seguro:** Área central del patio con bancas

**📐 DETALLES TÉCNICOS:**
• Pendiente escaleras: 32°
• Ancho pasillos: 2.8 metros
• Altura techos: 3.2 metros
• Capacidad gradas: 3 personas por fila

**🚨 PUNTOS CRÍTICOS:**
• **Escaleras norte:** Mayor riesgo de aglomeración
• **Patio central:** Verificar dispersión adecuada
• **Zona verde:** Reportar llegada con coordinador

**💡 TIPS DE NAVEGACIÓN:**
• Mantén la derecha en todo momento
• Si hay humo, mantente agachado
• Sigue a la persona de adelante si hay poca visibilidad
• Cuenta pasos para mantener concentración

**📱 UNA VEZ SEGURO:**
• Confirma tu ubicación con coordinador
• Ayuda a contar personas evacuadas
• Permanece en área asignada hasta nueva instrucción`;
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
        
        // Procesar como consulta normal
        const result = this.processBloqueQuery(intent);
        if (result) {
            return result;
        }
        
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

**🚨 EVACUACIÓN PRIORITARIA:**
• **Bloque G**: Protocolo específico disponible
• **Bloque H**: Protocolo específico disponible

Mi expertise incluye:
• 🏠 Evaluación de riesgo por ubicación
• 👨‍👩‍👧‍👦 Planes de seguridad familiar  
• 📦 Kits de emergencia volcánica
• 🗺️ Rutas de evacuación
• 🚨 Procedimientos durante erupciones

**¿Tienes alguna consulta sobre el Volcán Cotopaxi?**

Ejemplos:
• "Evacuación Bloque G"
• "Evacuación Bloque H"
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