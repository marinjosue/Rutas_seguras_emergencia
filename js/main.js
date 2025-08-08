import {
  cargarZonasSeguras,
  cargarZonasPeligro,
  actualizarTabla
} from './rutas.js';

import { evaluarRutasConGWO } from './gwo.js';

const API_KEY = '5b3ce3597851110001cf6248497015ea4dcd4f809a3e9f36477bcbbf';

const map = L.map('map').setView([-0.3132, -78.4408], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);  

let userMarker = null;
let routeLine = null;
let zonasGeoJSON = null;
let peligroGeoJSON = null;
let ultimaUbicacion = null;
let rutaSeleccionadaLine = null;
let filaSeleccionada = null;
let rutaActualCoords = null;
let datosListos = false;

// Exponer variables globales para el chatbot
window.ubicacionActual = null;
window.rutaActual = null;
window.zonasSeguras = null;

// Función para mostrar estado de carga
function mostrarEstadoCarga(mensaje) {
  console.log("Estado:", mensaje);
  
  // Crear o actualizar indicador visual
  let indicator = document.getElementById('loading-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'loading-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(37, 99, 235, 0.9);
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(indicator);
  }
  indicator.textContent = mensaje;
  
  // Auto-ocultar después de 3 segundos si es mensaje de éxito
  if (mensaje.includes('✓') || mensaje.includes('listo')) {
    setTimeout(() => {
      if (indicator) indicator.remove();
    }, 3000);
  }
}

function setUserMarker(coords, texto = "Tu ubicación") {
  mostrarEstadoCarga(`📍 Ubicación establecida`);
  
  if (userMarker) map.removeLayer(userMarker);
  
  // Crear marcador personalizado más visible
  const customIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: #2563eb;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(37,99,235,0.4);
        position: relative;
      ">
        <div style="
          width: 40px;
          height: 40px;
          border: 2px solid #2563eb;
          border-radius: 50%;
          position: absolute;
          top: -13px;
          left: -13px;
          opacity: 0.3;
          animation: pulse 2s infinite;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
  
  userMarker = L.marker(coords, { icon: customIcon })
    .addTo(map)
    .bindPopup(texto)
    .openPopup();
    
  ultimaUbicacion = coords;
  window.ubicacionActual = coords;
  
  // Centrar mapa en la ubicación
  map.setView(coords, 18);
  
  // Habilitar botón si los datos están listos
  verificarEstadoCompleto();
  
  console.log("✓ Ubicación establecida:", coords);
}

function verificarEstadoCompleto() {
  if (ultimaUbicacion && datosListos) {
    document.getElementById("btn-calcular-ruta").disabled = false;
    mostrarEstadoCarga(`✓ Sistema listo para calcular rutas`);
    console.log("✓ Sistema completamente listo");
  }
}

// Cambia: permite color personalizado
function setRouteLine(coords, color = 'blue') {
  if (routeLine) map.removeLayer(routeLine);
  routeLine = L.polyline(coords, { color, weight: 6 }).addTo(map);
  map.fitBounds(routeLine.getBounds());
  rutaActualCoords = coords;
  
  // Actualizar variable global para chatbot
  window.rutaActual = { coords, color };
}

// Nueva función para ruta seleccionada (color rojo)
function setRutaSeleccionadaLine(coords) {
  if (rutaSeleccionadaLine) map.removeLayer(rutaSeleccionadaLine);
  rutaSeleccionadaLine = L.polyline(coords, { color: 'red', weight: 6 }).addTo(map);
  map.fitBounds(rutaSeleccionadaLine.getBounds());
  rutaActualCoords = coords;
  
  // Actualizar variable global para chatbot
  window.rutaActual = { coords, color: 'red' };
}

// GEOLOCALIZACIÓN INMEDIATA Y AGRESIVA
function iniciarGelocalizacion() {
  mostrarEstadoCarga(`🔍 Detectando tu ubicación...`);
  
  if (!navigator.geolocation) {
    console.warn("Geolocalización no disponible");
    mostrarEstadoCarga(`⚠️ Geolocalización no disponible`);
    usarUbicacionPorDefecto();
    return;
  }

  const opciones = {
    enableHighAccuracy: true,
    timeout: 8000,
    maximumAge: 0 // No usar caché
  };

  // Intentar geolocalización de alta precisión
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      console.log("✓ Geolocalización exitosa:", coords);
      console.log("Precisión:", position.coords.accuracy, "metros");
      
      setUserMarker(coords, `📍 Tu ubicación actual (±${Math.round(position.coords.accuracy)}m)`);
    },
    (error) => {
      console.error("Error de geolocalización:", error);
      
      let mensaje = "Error desconocido";
      switch(error.code) {
        case error.PERMISSION_DENIED:
          mensaje = "Permisos de ubicación denegados";
          break;
        case error.POSITION_UNAVAILABLE:
          mensaje = "Ubicación no disponible";
          break;
        case error.TIMEOUT:
          mensaje = "Tiempo de espera agotado";
          break;
      }
      
      mostrarEstadoCarga(`⚠️ ${mensaje}`);
      
      // Intentar con opciones menos estrictas
      intentarGeolacalizacionAlternativa();
    },
    opciones
  );
}

function intentarGeolacalizacionAlternativa() {
  console.log("Intentando geolocalización alternativa...");
  
  const opcionesAlternativas = {
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: 60000 // Aceptar caché de 1 minuto
  };
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      console.log("✓ Geolocalización alternativa exitosa:", coords);
      setUserMarker(coords, `📍 Tu ubicación (aproximada)`);
    },
    (error) => {
      console.error("Error en geolocalización alternativa:", error);
      mostrarEstadoCarga(`❌ No se pudo obtener ubicación`);
      usarUbicacionPorDefecto();
    },
    opcionesAlternativas
  );
}

function usarUbicacionPorDefecto() {
  console.log("Usando ubicación por defecto (ESPE)");
  const coordsESPE = { lat: -0.3132, lng: -78.4408 };
  setUserMarker(coordsESPE, "📍 Campus ESPE (ubicación por defecto)");
}

// CARGAR DATOS Y LUEGO GEOLOCALIZACIÓN
async function inicializarAplicacion() {
  console.log("🚀 Inicializando aplicación...");
  mostrarEstadoCarga(`🔄 Cargando datos del mapa...`);
  
  try {
    // Cargar datos en paralelo
    const [zonasData, peligroData] = await Promise.all([
      cargarZonasSeguras(map),
      cargarZonasPeligro(map)
    ]);
    
    // Cargar GeoJSON de zonas seguras para el algoritmo
    const response = await fetch('./data/zonas_seguras.geojson');
    zonasGeoJSON = await response.json();
    peligroGeoJSON = peligroData;
    window.zonasSeguras = zonasGeoJSON.features;
    
    console.log("✓ Zonas seguras cargadas:", zonasGeoJSON.features.length);
    mostrarEstadoCarga(`✓ Datos cargados`);
    
    // Cargar capas adicionales
    await cargarCapasAdicionales();
    
    datosListos = true;
    console.log("✓ Todos los datos cargados");
    
    // AHORA iniciar geolocalización
    iniciarGelocalizacion();
    
  } catch (error) {
    console.error("Error cargando datos:", error);
    mostrarEstadoCarga(`❌ Error cargando datos`);
    
    // Aún así intentar geolocalización
    datosListos = true;
    iniciarGelocalizacion();
  }
}

async function cargarCapasAdicionales() {
  try {
    // Cargar zona_ESPE.geojson (contorno azul)
    const espeResponse = await fetch('./data/zona_ESPE.geojson');
    const espeData = await espeResponse.json();
    L.geoJSON(espeData, {
      style: {
        color: '#1E90FF',
        fillColor: '#E0F0FF',
        weight: 2,
        fillOpacity: 0.3
      }
    }).addTo(map);

    // Cargar rutas_ESPE.geojson (líneas verdes)
    const rutasResponse = await fetch('./data/rutas_ESPE.geojson');
    const rutasData = await rutasResponse.json();
    L.geoJSON(rutasData, {
      style: {
        color: '#1FAA59',
        weight: 2
      }
    }).addTo(map);
    
    console.log("✓ Capas adicionales cargadas");
  } catch (error) {
    console.warn("Advertencia cargando capas adicionales:", error);
  }
}

// Evento: clic manual en el mapa
map.on('click', (e) => {
  console.log("👆 Clic manual en mapa:", e.latlng);
  setUserMarker(e.latlng, "📍 Ubicación seleccionada manualmente");
});

// Botón CALCULAR RUTA
document.getElementById("btn-calcular-ruta").addEventListener("click", async () => {
  console.log("🧮 Iniciando cálculo de ruta...");
  mostrarEstadoCarga(`🧮 Calculando rutas...`);
  
  if (!ultimaUbicacion) {
    alert("❌ Selecciona una ubicación primero.");
    return;
  }

  if (!zonasGeoJSON || !peligroGeoJSON) {
    alert("❌ Los datos aún se están cargando. Espera un momento.");
    return;
  }

  try {
    const resultados = await evaluarRutasConGWO(ultimaUbicacion, zonasGeoJSON, peligroGeoJSON, API_KEY);
    if (!resultados || resultados.length === 0) {
      alert("❌ No se encontraron rutas válidas.");
      mostrarEstadoCarga(`❌ Sin rutas válidas`);
      return;
    }

    console.log("✓ Rutas calculadas:", resultados.length);
    mostrarEstadoCarga(`✓ ${resultados.length} rutas encontradas`);

    reproducirAlertaVoz();

    const mejor = resultados[0];
    const ruta = await obtenerRutaDesdeORS(ultimaUbicacion, mejor.coords);
    if (!ruta) return;

    const puntos = ruta.geometry.coordinates.map(c => [c[1], c[0]]);
    setRouteLine(puntos, 'blue');
    if (rutaSeleccionadaLine) {
      map.removeLayer(rutaSeleccionadaLine);
      rutaSeleccionadaLine = null;
    }
    actualizarTabla(resultados);

    // Permitir seleccionar rutas desde la tabla
    agregarEventoSeleccionTabla(resultados);
    
    // Notificar al chatbot si está disponible
    if (window.chatbot) {
      window.chatbot.onRouteCalculated({
        distance: (mejor.distancia / 1000).toFixed(2),
        duration: Math.ceil(mejor.duracion / 60)
      });
    }
    
  } catch (error) {
    console.error("❌ Error calculando ruta:", error);
    mostrarEstadoCarga(`❌ Error en cálculo`);
    alert("❌ Error al calcular la ruta. Inténtalo de nuevo.");
  }
});

function reproducirAlertaVoz() {
  const mensaje = "Erupción volcánica detectada, sigue la ruta más segura según tu ubicación";
  for (let i = 0; i < 2; i++) {
    const utter = new window.SpeechSynthesisUtterance(mensaje);
    utter.lang = "es-ES";
    window.speechSynthesis.speak(utter);
  }
}

// ORS para obtener ruta
async function obtenerRutaDesdeORS(from, to) {
  const res = await fetch("https://api.openrouteservice.org/v2/directions/foot-walking/geojson", {
    method: "POST",
    headers: {
      'Authorization': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat]
      ]
    })
  });
  const data = await res.json();
  return data.features[0];
}

function agregarEventoSeleccionTabla(resultados) {
  const tbody = document.querySelector("#tabla-resultados tbody");
  Array.from(tbody.querySelectorAll("tr")).forEach((row, idx) => {
    if (resultados[idx]) {
      row.style.cursor = "pointer";
      row.onclick = async () => {
        // Quitar selección previa
        if (filaSeleccionada) filaSeleccionada.classList.remove("fila-seleccionada");
        row.classList.add("fila-seleccionada");
        filaSeleccionada = row;

        // Quitar línea anterior
        if (rutaSeleccionadaLine) {
          map.removeLayer(rutaSeleccionadaLine);
          rutaSeleccionadaLine = null;
        }

        // Dibujar nueva ruta seleccionada en rojo
        const ruta = await obtenerRutaDesdeORS(ultimaUbicacion, resultados[idx].coords);
        if (!ruta) return;
        const puntos = ruta.geometry.coordinates.map(c => [c[1], c[0]]);
        setRutaSeleccionadaLine(puntos);
      };
    }
  });
}

// Botón para centrar en la ubicación del usuario
document.getElementById("btn-centrar-ubicacion").addEventListener("click", () => {
  if (ultimaUbicacion) {
    map.setView(ultimaUbicacion, 18);
    if (userMarker) userMarker.openPopup();
  } else {
    // Forzar nueva geolocalización
    iniciarGelocalizacion();
  }
});

// Escuchar cambios de ubicación y dar indicaciones
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(pos => {
    const userPos = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    };
    // Solo si hay ruta activa
    if (rutaActualCoords && rutaActualCoords.length > 2) {
      const indicacion = obtenerIndicacion(userPos, rutaActualCoords);
      if (indicacion) reproducirIndicacionVoz(indicacion);
    }
  }, 
  (error) => {
    console.warn("Error en watchPosition:", error);
  }, 
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000
  });
}

// Función para obtener indicación básica
function obtenerIndicacion(userPos, rutaCoords) {
  // Encuentra el punto más cercano de la ruta al usuario
  let minDist = Infinity, idx = 0;
  for (let i = 0; i < rutaCoords.length; i++) {
    const d = distancia(userPos, { lat: rutaCoords[i][0], lng: rutaCoords[i][1] });
    if (d < minDist) {
      minDist = d;
      idx = i;
    }
  }
  // Si está cerca del final, decir "Has llegado"
  if (idx >= rutaCoords.length - 2 && minDist < 0.0002) return "Has llegado a la zona segura";
  // Si hay suficiente puntos para calcular ángulo
  if (idx < rutaCoords.length - 2) {
    const p1 = rutaCoords[idx];
    const p2 = rutaCoords[idx + 1];
    const p3 = rutaCoords[idx + 2];
    const ang1 = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
    const ang2 = Math.atan2(p3[0] - p2[0], p3[1] - p2[1]);
    const diff = ang2 - ang1;
    if (Math.abs(diff) < Math.PI / 8) return "Sigue recto";
    if (diff > 0) return "Gira a la izquierda";
    if (diff < 0) return "Gira a la derecha";
  }
  return null;
}

// Distancia aproximada en grados (suficiente para distancias cortas)
function distancia(a, b) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

// Voz para indicaciones
let ultimaIndicacion = "";
function reproducirIndicacionVoz(texto) {
  if (texto === ultimaIndicacion) return; // Evita repetir
  ultimaIndicacion = texto;
  const utter = new window.SpeechSynthesisUtterance(texto);
  utter.lang = "es-ES";
  window.speechSynthesis.speak(utter);
}

// Agregar estilos para el marcador personalizado
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .custom-user-marker {
    animation: pulse 2s infinite;
  }
  
  #loading-indicator {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-weight: 500;
  }
`;
document.head.appendChild(style);

// INICIAR TODO CUANDO EL DOM ESTÉ LISTO
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarAplicacion);
} else {
  inicializarAplicacion();
}