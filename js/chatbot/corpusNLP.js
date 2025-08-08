/* filepath: js/chatbot/corpusNLP.js */
/**
 * Sistema de procesamiento NLP inteligente basado en corpus entrenado
 * Enfocado en dominio volcánico con análisis contextual avanzado
 */

class CorpusNLP {
    constructor() {
        this.corpusData = null;
        this.nlpUtils = new NLPUtils();
        this.loaded = false;
        
        // Mapeo inteligente de contextos volcánicos
        this.contextualMappings = {
            // Contextos de preparación
            preparacion: {
                keywords: ['preparar', 'alistar', 'organizar', 'planear', 'planificar'],
                boost_intents: ['kit_emergencia', 'plan_familiar', 'preparacion_hogar']
            },
            
            // Contextos de emergencia activa
            emergencia_activa: {
                keywords: ['durante', 'ahora', 'esta', 'sucediendo', 'pasando', 'activo'],
                boost_intents: ['durante_erupcion', 'proteccion_ceniza', 'evacuacion_especial']
            },
            
            // Contextos de información
            informacion: {
                keywords: ['que', 'como', 'cuando', 'donde', 'porque', 'cual'],
                boost_intents: ['senales_volcanicas', 'alertas_igepn', 'efectos_salud']
            },
            
            // Contextos de comunicación
            comunicacion: {
                keywords: ['llamar', 'contactar', 'numero', 'telefono', 'comunicar'],
                boost_intents: ['numeros_emergencia', 'comunicacion', 'fuentes_oficiales']
            },
            
            // Contextos familiares
            familia: {
                keywords: ['familia', 'hijos', 'niños', 'bebes', 'ancianos', 'mascotas'],
                boost_intents: ['plan_familiar', 'evacuacion_especial', 'kit_emergencia']
            }
        };
    }

    async loadCorpus() {
        try {
            const response = await fetch('data/chatbot/filtro_cotopaxi.json');
            this.corpusData = await response.json();
            this.loaded = true;
            console.log('📚 Corpus NLP Inteligente cargado:', this.corpusData.metadata);
            return true;
        } catch (error) {
            console.error('❌ Error cargando corpus NLP:', error);
            this.loaded = false;
            return false;
        }
    }

    /**
     * Analiza un texto con contexto inteligente mejorado
     */
    analyzeIntent(userText) {
        if (!this.loaded || !this.corpusData) {
            console.warn('Corpus no cargado, usando análisis básico inteligente');
            return this.intelligentBasicAnalysis(userText);
        }

        const features = this.nlpUtils.extractFeatures(userText);
        const contextualInfo = this.analyzeContextualClues(features);
        const scores = this.calculateIntelligentScores(features, contextualInfo);
        
        const bestIntent = this.getBestIntent(scores);
        
        return {
            intent: bestIntent.intent,
            confidence: bestIntent.score,
            features: features,
            contextual: contextualInfo,
            allScores: scores,
            method: 'intelligent_corpus_nlp'
        };
    }

    /**
     * Analiza pistas contextuales en el texto
     */
    analyzeContextualClues(features) {
        const contexts = {
            urgency_level: this.detectUrgencyLevel(features),
            question_type: features.questionType,
            family_context: this.detectFamilyContext(features),
            temporal_context: this.detectTemporalContext(features),
            location_context: this.detectLocationContext(features)
        };

        return contexts;
    }

    /**
     * Detecta nivel de urgencia en la consulta
     */
    detectUrgencyLevel(features) {
        const urgencyIndicators = {
            high: ['urgente', 'rapido', 'rápido', 'ya', 'ahora', 'inmediato', 'socorro'],
            medium: ['pronto', 'importante', 'necesario', 'debo', 'tengo que'],
            low: ['cuando', 'como', 'información', 'saber', 'conocer']
        };

        for (const [level, indicators] of Object.entries(urgencyIndicators)) {
            for (const indicator of indicators) {
                if (features.cleaned.includes(indicator)) {
                    return level;
                }
            }
        }

        return 'low';
    }

    /**
     * Detecta contexto familiar
     */
    detectFamilyContext(features) {
        const familyKeywords = ['familia', 'hijos', 'niños', 'bebé', 'anciano', 'mascota', 'perro', 'gato'];
        return familyKeywords.some(keyword => features.cleaned.includes(keyword));
    }

    /**
     * Detecta contexto temporal
     */
    detectTemporalContext(features) {
        const timeIndicators = {
            past: ['pasó', 'ocurrió', 'fue', 'había'],
            present: ['está', 'es', 'hay', 'ahora', 'actualmente'],
            future: ['va', 'será', 'puede', 'podría', 'cuando']
        };

        for (const [time, indicators] of Object.entries(timeIndicators)) {
            for (const indicator of indicators) {
                if (features.cleaned.includes(indicator)) {
                    return time;
                }
            }
        }

        return 'general';
    }

    /**
     * Detecta contexto de ubicación
     */
    detectLocationContext(features) {
        const locations = ['quito', 'latacunga', 'sangolqui', 'machachi', 'rumiñahui', 'cotopaxi', 'espe'];
        return locations.find(loc => features.cleaned.includes(loc)) || null;
    }

    /**
     * Calcula puntuaciones inteligentes con contexto
     */
    calculateIntelligentScores(features, contextualInfo) {
        const scores = {
            kit_emergencia: 0,
            plan_familiar: 0,
            senales_volcanicas: 0,
            proteccion_ceniza: 0,
            evacuacion_especial: 0,
            rutas_evacuacion: 0,
            agua_segura: 0,
            numeros_emergencia: 0,
            comunicacion: 0,
            efectos_salud: 0,
            primeros_auxilios: 0,
            preparacion_hogar: 0,
            durante_erupcion: 0,
            documentos_importantes: 0,
            alertas_igepn: 0,
            sirenas_emergencia: 0,
            fuentes_oficiales: 0,
            default: 0
        };

        // 1. Análisis base de keywords (30%)
        this.analyzeKeywords(features, scores, 0.3);
        
        // 2. Análisis de bigrams (25%)
        this.analyzeBigrams(features, scores, 0.25);
        
        // 3. Análisis contextual inteligente (25%)
        this.applyContextualBoosts(features, contextualInfo, scores, 0.25);
        
        // 4. Análisis de patrones (20%)
        this.analyzePatterns(features, scores, 0.2);

        // 5. Normalizar y aplicar filtros inteligentes
        return this.normalizeAndFilter(scores, contextualInfo);
    }

    /**
     * Aplica boosts contextuales inteligentes
     */
    applyContextualBoosts(features, contextualInfo, scores, weight) {
        // Boost por nivel de urgencia
        if (contextualInfo.urgency_level === 'high') {
            scores.durante_erupcion += weight * 0.5;
            scores.numeros_emergencia += weight * 0.4;
            scores.evacuacion_especial += weight * 0.4;
        }

        // Boost por contexto familiar
        if (contextualInfo.family_context) {
            scores.plan_familiar += weight * 0.6;
            scores.evacuacion_especial += weight * 0.5;
            scores.kit_emergencia += weight * 0.3;
        }

        // Boost por contexto temporal
        if (contextualInfo.temporal_context === 'future') {
            scores.kit_emergencia += weight * 0.4;
            scores.plan_familiar += weight * 0.4;
            scores.preparacion_hogar += weight * 0.3;
        } else if (contextualInfo.temporal_context === 'present') {
            scores.durante_erupcion += weight * 0.5;
            scores.proteccion_ceniza += weight * 0.4;
        }

        // Boost por ubicación específica
        if (contextualInfo.location_context) {
            scores.rutas_evacuacion += weight * 0.4;
            scores.alertas_igepn += weight * 0.3;
        }

        // Boost por tipo de pregunta
        if (contextualInfo.question_type) {
            this.applyQuestionTypeBoost(contextualInfo.question_type, scores, weight);
        }
    }

    /**
     * Aplica boost según tipo de pregunta
     */
    applyQuestionTypeBoost(questionType, scores, weight) {
        const questionBoosts = {
            'como': {
                kit_emergencia: 0.6,
                plan_familiar: 0.5,
                preparacion_hogar: 0.5,
                proteccion_ceniza: 0.4
            },
            'que': {
                senales_volcanicas: 0.6,
                efectos_salud: 0.5,
                durante_erupcion: 0.4,
                documentos_importantes: 0.4
            },
            'cuando': {
                alertas_igepn: 0.6,
                senales_volcanicas: 0.5,
                sirenas_emergencia: 0.5
            },
            'donde': {
                rutas_evacuacion: 0.6,
                numeros_emergencia: 0.4,
                fuentes_oficiales: 0.4
            },
            'cual': {
                numeros_emergencia: 0.5,
                rutas_evacuacion: 0.4,
                fuentes_oficiales: 0.4
            }
        };

        const boosts = questionBoosts[questionType];
        if (boosts) {
            for (const [intent, boost] of Object.entries(boosts)) {
                scores[intent] += weight * boost;
            }
        }
    }

    /**
     * Normaliza scores y aplica filtros inteligentes
     */
    normalizeAndFilter(scores, contextualInfo) {
        // Encontrar el score máximo para normalización
        const maxScore = Math.max(...Object.values(scores));
        
        if (maxScore === 0) {
            return scores;
        }

        // Normalizar scores (0-1)
        const normalizedScores = {};
        for (const [intent, score] of Object.entries(scores)) {
            normalizedScores[intent] = Math.min(score / maxScore, 1.0);
        }

        // Aplicar penalización a intents que no tienen sentido en el contexto
        this.applyContextualPenalties(normalizedScores, contextualInfo);

        return normalizedScores;
    }

    /**
     * Aplica penalizaciones contextuales
     */
    applyContextualPenalties(scores, contextualInfo) {
        // Si hay urgencia alta, penalizar intents de preparación
        if (contextualInfo.urgency_level === 'high') {
            scores.kit_emergencia *= 0.7;
            scores.plan_familiar *= 0.7;
            scores.preparacion_hogar *= 0.5;
        }

        // Si es consulta de información general, penalizar acciones urgentes
        if (contextualInfo.urgency_level === 'low' && contextualInfo.question_type) {
            scores.durante_erupcion *= 0.8;
            scores.numeros_emergencia *= 0.8;
        }
    }

    /**
     * Análisis de keywords mejorado
     */
    analyzeKeywords(features, scores, weight) {
        const corpusKeywords = this.corpusData.keywords_stem || [];
        
        for (const stemmed of features.stemmed) {
            if (corpusKeywords.includes(stemmed)) {
                this.distributeIntelligentKeywordScore(stemmed, scores, weight * 1.0);
            } else {
                // Búsqueda aproximada más inteligente
                for (const keyword of corpusKeywords) {
                    const similarity = this.nlpUtils.stringSimilarity(stemmed, keyword);
                    if (similarity > 0.75) {
                        this.distributeIntelligentKeywordScore(keyword, scores, weight * similarity);
                    }
                }
            }
        }
    }

    /**
     * Distribución inteligente de puntuación por keyword
     */
    distributeIntelligentKeywordScore(keyword, scores, scoreValue) {
        const keywordMappings = {
            'volcan': {
                primary: ['senales_volcanicas', 'alertas_igepn'],
                secondary: ['durante_erupcion', 'efectos_salud']
            },
            'cotopaxi': {
                primary: ['senales_volcanicas', 'rutas_evacuacion'],
                secondary: ['alertas_igepn', 'fuentes_oficiales']
            },
            'erupcion': {
                primary: ['durante_erupcion', 'senales_volcanicas'],
                secondary: ['proteccion_ceniza', 'evacuacion_especial']
            },
            'ceniz': {
                primary: ['proteccion_ceniza', 'efectos_salud'],
                secondary: ['durante_erupcion', 'agua_segura']
            },
            'emergencia': {
                primary: ['numeros_emergencia', 'kit_emergencia'],
                secondary: ['plan_familiar', 'durante_erupcion']
            },
            'familia': {
                primary: ['plan_familiar', 'evacuacion_especial'],
                secondary: ['kit_emergencia', 'documentos_importantes']
            },
            'kit': {
                primary: ['kit_emergencia'],
                secondary: ['preparacion_hogar', 'documentos_importantes']
            },
            'agua': {
                primary: ['agua_segura'],
                secondary: ['kit_emergencia', 'efectos_salud']
            },
            'salud': {
                primary: ['efectos_salud', 'primeros_auxilios'],
                secondary: ['proteccion_ceniza', 'agua_segura']
            }
        };

        const mapping = keywordMappings[keyword];
        if (mapping) {
            // Distribuir a intents primarios
            for (const intent of mapping.primary) {
                scores[intent] += scoreValue;
            }
            // Distribuir a intents secundarios con menor peso
            for (const intent of mapping.secondary) {
                scores[intent] += scoreValue * 0.6;
            }
        } else {
            // Distribución genérica
            scores.default += scoreValue * 0.3;
        }
    }

    /**
     * Análisis básico inteligente cuando corpus no está disponible
     */
    intelligentBasicAnalysis(userText) {
        const features = this.nlpUtils.extractFeatures(userText);
        const contextual = this.analyzeContextualClues(features);
        
        // Mapeo inteligente básico
        const intelligentMapping = {
            // Términos de preparación
            'kit': 'kit_emergencia',
            'mochila': 'kit_emergencia',
            'preparar': 'kit_emergencia',
            'alistar': 'kit_emergencia',
            
            // Términos familiares
            'familia': 'plan_familiar',
            'plan': 'plan_familiar',
            'hijos': 'evacuacion_especial',
            'niños': 'evacuacion_especial',
            
            // Términos volcánicos
            'volcan': 'senales_volcanicas',
            'cotopaxi': 'senales_volcanicas',
            'erupcion': 'durante_erupcion',
            'ceniza': 'proteccion_ceniza',
            
            // Términos de emergencia
            'emergencia': 'numeros_emergencia',
            'telefono': 'numeros_emergencia',
            'llamar': 'numeros_emergencia',
            
            // Términos de salud
            'salud': 'efectos_salud',
            'respirar': 'efectos_salud',
            'tos': 'efectos_salud'
        };
        
        // Buscar mejor match considerando contexto
        let bestIntent = 'default';
        let confidence = 0.3;
        
        for (const keyword of features.stemmed) {
            if (intelligentMapping[keyword]) {
                bestIntent = intelligentMapping[keyword];
                confidence = 0.7;
                break;
            }
        }
        
        // Ajustar confianza según contexto
        if (contextual.family_context && bestIntent.includes('familia')) {
            confidence += 0.2;
        }
        if (contextual.urgency_level === 'high') {
            confidence += 0.1;
        }
        
        return {
            intent: bestIntent,
            confidence: Math.min(confidence, 1.0),
            features: features,
            contextual: contextual,
            method: 'intelligent_basic'
        };
    }

    // Métodos heredados del CorpusNLP original
    analyzeBigrams(features, scores, weight) {
        // Implementación similar pero mejorada...
        const corpusBigrams = this.corpusData.bigrams || [];
        
        for (const bigram of features.bigrams) {
            for (const corpusBigram of corpusBigrams) {
                const similarity = this.nlpUtils.stringSimilarity(bigram, corpusBigram);
                if (similarity > 0.7) {
                    this.distributeBigramScore(corpusBigram, scores, weight * similarity);
                }
            }
        }
    }

    distributeBigramScore(bigram, scores, scoreValue) {
        // Mapeos específicos para bigrams
        const bigramMappings = {
            'volcan cotopaxi': ['senales_volcanicas', 'rutas_evacuacion'],
            'riesgos emergencias': ['alertas_igepn', 'numeros_emergencia'],
            'plan familiar': ['plan_familiar', 'evacuacion_especial'],
            'kit emergencia': ['kit_emergencia', 'preparacion_hogar']
        };

        const mapping = bigramMappings[bigram];
        if (mapping) {
            for (const intent of mapping) {
                scores[intent] += scoreValue;
            }
        } else {
            scores.default += scoreValue * 0.5;
        }
    }

    analyzePatterns(features, scores, weight) {
        // Análisis de patrones mejorado
        if (features.questionType) {
            this.applyQuestionTypeBoost(features.questionType, scores, weight);
        }
    }

    getBestIntent(scores) {
        let bestIntent = 'default';
        let bestScore = 0;
        
        for (const [intent, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score;
                bestIntent = intent;
            }
        }
        
        return {
            intent: bestIntent,
            score: Math.min(bestScore, 1.0)
        };
    }

    getCorpusStats() {
        if (!this.loaded) return null;
        
        return {
            totalTokens: this.corpusData.metadata?.tokens_total || 0,
            keywordsCount: this.corpusData.keywords_stem?.length || 0,
            bigramsCount: this.corpusData.bigrams?.length || 0,
            trigramsCount: this.corpusData.trigrams?.length || 0,
            patternsCount: this.corpusData.patrones_regex?.length || 0,
            domain: this.corpusData.metadata?.dominio || 'Unknown',
            intelligent_features: 'Context Analysis, Urgency Detection, Family Context, Temporal Analysis'
        };
    }
}

window.CorpusNLP = CorpusNLP;