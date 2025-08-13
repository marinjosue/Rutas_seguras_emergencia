// Definición de polígonos de los bloques
const BLOQUES = {
    G: {
        nombre: "Bloque G",
        coordenadas: [
            [-0.3131520139141486, -78.4452255640125],
            [-0.31321499706712075, -78.44522478578908],
            [-0.3132305268895266, -78.44507860156358],
            [-0.31300059330868635, -78.44505067940388],
            [-0.3129904175970353, -78.44520526225693],
            [-0.31315357074366545, -78.44522478536656]
        ],
        centro: [-0.3131520139141486, -78.4452255640125],
        color: "#8b5cf6"
    },
    H: {
        nombre: "Bloque H",
        coordenadas: [
            [-0.3128322127628991, -78.44566588427278],
            [-0.3130524982349385, -78.44568202172414],
            [-0.3130669666999637, -78.44555171573809],
            [-0.3128264065170612, -78.44554416800841],
            [-0.3128264065170612, -78.4456659166262]
        ],
        centro: [-0.31294758, -78.44560390],
        color: "#ec4899"
    }
};

// Variables globales
let bloqueDetectado = null;
let marcadorDeteccion = null;
let rutaEvacuacionLayer = null;

/**
 * Verifica si un punto está dentro de un polígono usando el algoritmo ray casting
 */
function puntoEnPoligono(punto, poligono) {
    const [lat, lng] = punto;
    let dentro = false;
    
    for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
        const [latI, lngI] = poligono[i];
        const [latJ, lngJ] = poligono[j];
        
        if (((latI > lat) !== (latJ > lat)) &&
            (lng < (lngJ - lngI) * (lat - latI) / (latJ - latI) + lngI)) {
            dentro = !dentro;
        }
    }
    
    return dentro;
}

/**
 * Detecta en qué bloque se encuentra una coordenada
 */
function detectarBloque(coordenadas) {
    const [lat, lng] = coordenadas;
    
    // Verificar cada bloque
    for (const [clave, bloque] of Object.entries(BLOQUES)) {
        if (puntoEnPoligono([lat, lng], bloque.coordenadas)) {
            return {
                codigo: clave,
                ...bloque
            };
        }
    }
    
    return null;
}

/**
 * Procesa la ubicación cuando el usuario hace clic en el mapa
 */
function procesarUbicacionManual(coordenadas) {
    const resultado = detectarBloque(coordenadas);
    
    if (resultado) {
        bloqueDetectado = resultado;
        
        // Si está en Bloque G, cargar ruta de evacuación automáticamente
        if (resultado.codigo === 'G') {
            cargarRutaEvacuacionBloqueG();
        }
        
        // Actualizar marcador SIN POPUP
        actualizarMarcadorDeteccion(coordenadas, resultado);
        
        // Notificar a otros sistemas
        notificarCambioBloque(resultado);
        
        return resultado;
    }
    
    return null;
}

/**
 * Carga la ruta de evacuación específica del Bloque G
 */
async function cargarRutaEvacuacionBloqueG() {
    try {
        // Intentar cargar desde el archivo principal de rutas
        const response = await fetch('./data/rutas_ESPE.geojson');
        const rutasData = await response.json();
        
        // Buscar la ruta de evacuación del Bloque G
        const rutaEvacuacion = rutasData.features.find(feature => 
            feature.properties.type === 'evacuation' && 
            feature.properties.building === 'Bloque G'
        );
        
        if (rutaEvacuacion) {
            mostrarRutaEnMapa(rutaEvacuacion);
            console.log('✅ Ruta de evacuación cargada desde rutas_ESPE.geojson');
        } else {
            mostrarRutaFallback();
        }
        
    } catch (error) {
        console.error('Error cargando rutas:', error);
        mostrarRutaFallback();
    }
}

/**
 * Muestra la ruta en el mapa usando datos GeoJSON
 */
function mostrarRutaEnMapa(rutaFeature) {
    // Remover ruta anterior si existe
    if (rutaEvacuacionLayer && window.map) {
        window.map.removeLayer(rutaEvacuacionLayer);
    }
    
    if (window.map) {
        rutaEvacuacionLayer = L.geoJSON(rutaFeature, {
            style: {
                color: '#ef4444',
                weight: 4,
                opacity: 0.9,
                dashArray: '10,5'
            }
        }).addTo(window.map);
    }
}

/**
 * Muestra ruta usando coordenadas hardcodeadas (fallback)
 */
function mostrarRutaFallback() {
    const coordenadasRuta = [
        [-0.31307209405069614, -78.44518612569831],
        [-0.31306761314212395, -78.4452701439883],
        [-0.31306201200676753, -78.44532279545012],
        [-0.3129085408866672, -78.44533175740115],
        [-0.31284580816566177, -78.44532727642566],
        [-0.3128547699831046, -78.44527126423218],
        [-0.3129141420229047, -78.44527686545156],
        [-0.312907420659883, -78.44534520032771],
        [-0.3128536497554535, -78.44533959910831],
        [-0.31286373180050475, -78.44528022618321],
        [-0.3129085408866672, -78.44528246667096],
        [-0.31290181952360285, -78.44530711203629],
        [-0.31268785613357863, -78.44525894154997],
        [-0.3123646583541273, -78.4452098250929],
        [-0.3124279884925869, -78.44505149739493]
    ];
    
    if (window.map) {
        // Remover ruta anterior si existe
        if (rutaEvacuacionLayer) {
            window.map.removeLayer(rutaEvacuacionLayer);
        }
        
        rutaEvacuacionLayer = L.polyline(coordenadasRuta, {
            color: '#ef4444',
            weight: 4,
            opacity: 0.9,
            dashArray: '10,5'
        }).addTo(window.map);
    }
}

/**
 * Actualiza marcador de detección en el mapa SIN POPUP
 */
function actualizarMarcadorDeteccion(coordenadas, bloque) {
    if (!window.map) return;
    
    // Remover marcador anterior
    if (marcadorDeteccion) {
        window.map.removeLayer(marcadorDeteccion);
    }
    
    // Crear nuevo marcador simple SIN POPUP
    const icono = L.divIcon({
        className: 'marcador-deteccion-simple',
        html: `<div style="
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            background-color: ${bloque.color};
        ">${bloque.codigo}</div>`,
        iconSize: [25, 25],
        iconAnchor: [12.5, 12.5]
    });
    
    // Crear marcador SIN POPUP - no bindPopup()
    marcadorDeteccion = L.marker(coordenadas, { icon: icono })
        .addTo(window.map);
}

/**
 * Notifica a otros sistemas sobre el cambio de bloque
 */
function notificarCambioBloque(bloque) {
    // Actualizar variables globales para otros módulos
    if (typeof window !== 'undefined') {
        window.bloqueActual = bloque;
        window.ubicacionActual = bloque.centro;
        
        // Variables específicas para el chatbot
        window.ubicacionDetectada = {
            bloque: bloque.codigo,
            nombre: bloque.nombre,
            coordenadas: bloque.centro,
            tieneRutaEvacuacion: bloque.codigo === 'G'
        };
    }
    
    // Disparar evento personalizado
    const evento = new CustomEvent('bloqueDetectado', {
        detail: bloque
    });
    document.dispatchEvent(evento);
    
    // Notificar al chatbot
    const eventoChatbot = new CustomEvent('ubicacionChatbot', {
        detail: {
            bloque: bloque.codigo,
            nombre: bloque.nombre,
            coordenadas: bloque.centro,
            tieneRutaEvacuacion: bloque.codigo === 'G'
        }
    });
    window.dispatchEvent(eventoChatbot);
    
    // Guardar en localStorage
    localStorage.setItem('ubicacionActual', JSON.stringify({
        bloque: bloque.codigo,
        nombre: bloque.nombre,
        coordenadas: bloque.centro,
        timestamp: Date.now()
    }));
    
    console.log(`📍 Usuario ubicado en: ${bloque.nombre}`);
}

/**
 * Procesa clics en el mapa
 */
function procesarClicMapa(coordenadas) {
    return procesarUbicacionManual(coordenadas);
}

// Funciones públicas para uso externo
window.DeteccionBloque = {
    procesar: procesarUbicacionManual,
    procesarClic: procesarClicMapa,
    obtenerActual: () => bloqueDetectado,
    bloques: BLOQUES
};

console.log('🎯 Sistema de detección de bloques cargado - SIN popups informativos');