/* filepath: js/chatbot/nlpUtils.js */
/**
 * Utilidades para procesamiento de lenguaje natural en español
 * Enfocado en el dominio volcánico del Cotopaxi
 */

class NLPUtils {
    constructor() {
        // Stopwords en español
        this.stopwords = new Set([
            'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son',
            'con', 'para', 'como', 'las', 'del', 'los', 'una', 'al', 'me', 'si', 'ya', 'todo', 'esta', 'muy', 'mas',
            'pero', 'sus', 'le', 'ha', 'mi', 'o', 'puede', 'hasta', 'desde', 'cuando', 'donde', 'quien', 'cual',
            'porque', 'sobre', 'entre', 'ser', 'hacer', 'tener', 'estar', 'ir', 'ver', 'dar', 'saber', 'querer',
            'mismo', 'yo', 'tu', 'el', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas'
        ]);

        // Diccionario básico de stemming para español
        this.stemRules = {
            // Plurales
            'es$': '',
            's$': '',
            // Verbos
            'ando$': 'ar',
            'iendo$': 'er',
            'ado$': 'ar',
            'ido$': 'er',
            'ción$': 'r',
            'sión$': 'r',
            // Adjetivos
            'mente$': '',
            'oso$': '',
            'osa$': '',
            'ivo$': '',
            'iva$': '',
            // Sustantivos
            'dad$': '',
            'tad$': '',
            'eza$': '',
            'ura$': '',
            'ción$': '',
            'sión$': ''
        };

        // Sinónimos específicos del dominio volcánico
        this.synonyms = {
            'volcan': ['volcán', 'monte', 'crater', 'cráter'],
            'erupcion': ['erupción', 'explosión', 'actividad', 'activacion', 'activación'],
            'ceniza': ['cenizas', 'polvo', 'particulas', 'partículas'],
            'emergencia': ['crisis', 'desastre', 'catastrofe', 'catástrofe', 'urgencia'],
            'evacuacion': ['evacuación', 'salida', 'escape', 'huida'],
            'seguridad': ['protección', 'seguro', 'resguardo', 'refugio'],
            'peligro': ['riesgo', 'amenaza', 'peligroso', 'riesgoso'],
            'preparacion': ['preparación', 'prevención', 'prevencion', 'preparar'],
            'kit': ['mochila', 'bolsa', 'equipamiento', 'elementos', 'suministros'],
            'familia': ['familiar', 'casa', 'hogar', 'domestico', 'doméstico']
        };
    }

    /**
     * Limpia y normaliza el texto de entrada
     */
    cleanText(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/[^\w\s]/g, ' ') // Eliminar puntuación
            .replace(/\s+/g, ' ') // Normalizar espacios
            .trim();
    }

    /**
     * Tokeniza el texto en palabras
     */
    tokenize(text) {
        const cleaned = this.cleanText(text);
        return cleaned.split(/\s+/).filter(token => 
            token.length > 2 && !this.stopwords.has(token)
        );
    }

    /**
     * Aplica stemming básico a una palabra
     */
    stem(word) {
        if (!word || word.length < 3) return word;
        
        let stemmed = word.toLowerCase();
        
        // Aplicar reglas de stemming
        for (const [pattern, replacement] of Object.entries(this.stemRules)) {
            const regex = new RegExp(pattern);
            if (regex.test(stemmed)) {
                stemmed = stemmed.replace(regex, replacement);
                break; // Solo aplicar la primera regla que coincida
            }
        }
        
        return stemmed || word;
    }

    /**
     * Extrae bigrams del texto
     */
    getBigrams(tokens) {
        const bigrams = [];
        for (let i = 0; i < tokens.length - 1; i++) {
            bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
        }
        return bigrams;
    }

    /**
     * Extrae trigrams del texto
     */
    getTrigrams(tokens) {
        const trigrams = [];
        for (let i = 0; i < tokens.length - 2; i++) {
            trigrams.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
        }
        return trigrams;
    }

    /**
     * Expande sinónimos en el texto
     */
    expandSynonyms(word) {
        const stemmed = this.stem(word);
        
        // Buscar en sinónimos
        for (const [key, synonyms] of Object.entries(this.synonyms)) {
            if (synonyms.includes(word) || synonyms.includes(stemmed) || key === stemmed) {
                return key; // Devolver la forma canónica
            }
        }
        
        return stemmed;
    }

    /**
     * Calcula similaridad entre dos arrays de tokens usando Jaccard
     */
    jaccardSimilarity(set1, set2) {
        const intersection = set1.filter(x => set2.includes(x));
        const union = [...new Set([...set1, ...set2])];
        
        return union.length === 0 ? 0 : intersection.length / union.length;
    }

    /**
     * Calcula distancia de Levenshtein entre dos strings
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    /**
     * Calcula similaridad de strings usando Levenshtein normalizada
     */
    stringSimilarity(str1, str2) {
        const maxLength = Math.max(str1.length, str2.length);
        if (maxLength === 0) return 1.0;
        
        const distance = this.levenshteinDistance(str1, str2);
        return 1.0 - (distance / maxLength);
    }

    /**
     * Detecta patrones de preguntas en español
     */
    detectQuestionPattern(text) {
        const questionPatterns = [
            /^(como|cómo)\s+/i,           // "¿Cómo...?"
            /^(que|qué)\s+/i,             // "¿Qué...?"
            /^(cuando|cuándo)\s+/i,       // "¿Cuándo...?"
            /^(donde|dónde)\s+/i,         // "¿Dónde...?"
            /^(por\s+que|por\s+qué)\s+/i, // "¿Por qué...?"
            /^(cual|cuál)\s+/i,           // "¿Cuál...?"
            /^(quien|quién)\s+/i          // "¿Quién...?"
        ];

        for (const pattern of questionPatterns) {
            if (pattern.test(text)) {
                return pattern.source.replace(/[^a-zA-Z]/g, '');
            }
        }

        return null;
    }

    /**
     * Procesa texto completo y devuelve features para análisis
     */
    extractFeatures(text) {
        const cleaned = this.cleanText(text);
        const tokens = this.tokenize(cleaned);
        const stemmed = tokens.map(token => this.expandSynonyms(token));
        const bigrams = this.getBigrams(tokens);
        const trigrams = this.getTrigrams(tokens);
        const questionType = this.detectQuestionPattern(cleaned);

        return {
            original: text,
            cleaned: cleaned,
            tokens: tokens,
            stemmed: stemmed,
            bigrams: bigrams,
            trigrams: trigrams,
            questionType: questionType,
            length: tokens.length
        };
    }
}

// Exportar para uso en otros módulos
window.NLPUtils = NLPUtils;