import {
  cargarZonasSeguras,
  cargarZonasPeligro,
  actualizarTabla
} from './rutas.js';

import { evaluarRutasConGWO } from './gwo.js';

const API_KEY = '5b3ce3597851110001cf6248497015ea4dcd4f809a3e9f36477bcbbf';

const map = L.map('map', {
  maxZoom: 22
}).setView([-0.3132, -78.4408], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 22
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
window.bloqueActual = null; // Inicializar como null

// Función para mostrar estado de carga
function mostrarEstadoCarga(mensaje) {
  console.log("Estado:", mensaje);
  
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
  
  if (mensaje.includes('✓') || mensaje.includes('listo')) {
    setTimeout(() => {
      if (indicator) indicator.remove();
    }, 3000);
  }
}

function setUserMarker(coords, texto = "Tu ubicación") {
  mostrarEstadoCarga(`📍 Ubicación establecida`);
  
  if (userMarker) map.removeLayer(userMarker);
  
  // Crear marcador simple SIN animación
  const customIcon = L.divIcon({
    className: 'simple-user-marker',
    html: `
      <div style="
        width: 16px;
        height: 16px;
        background: #2563eb;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(37,99,235,0.4);
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
  
  userMarker = L.marker(coords, { icon: customIcon })
    .addTo(map)
    .bindPopup(texto);
    
  ultimaUbicacion = coords;
  window.ubicacionActual = coords;
  
  // IMPORTANTE: Limpiar detección anterior
  limpiarDeteccionAnterior();
  
  // Procesar nueva ubicación con sistema de detección
  if (typeof window.DeteccionBloque !== 'undefined') {
    window.DeteccionBloque.procesar([coords.lat, coords.lng], true);
  }
  
  // Centrar mapa en la ubicación
  map.setView(coords, 18);
  
  // Habilitar botón si los datos están listos
  verificarEstadoCompleto();
  
  console.log("✓ Ubicación establecida:", coords);
}

// NUEVA función para limpiar detección anterior
function limpiarDeteccionAnterior() {
  // Limpiar variables globales
  window.bloqueActual = null;
  window.ubicacionDetectada = null;
  
  // Limpiar localStorage
  localStorage.removeItem('ubicacionActual');
  
  // Limpiar marcador de detección si existe
  if (window.DeteccionBloque && typeof window.DeteccionBloque.limpiar === 'function') {
    window.DeteccionBloque.limpiar();
  }
  
  console.log("🧹 Detección anterior limpiada");
}

function verificarEstadoCompleto() {
  if (ultimaUbicacion && datosListos) {
    document.getElementById("btn-calcular-ruta").disabled = false;
    mostrarEstadoCarga(`✓ Sistema listo para calcular rutas`);
    console.log("✓ Sistema completamente listo");
  }
}

function setRouteLine(coords, color = 'blue') {
  if (routeLine) map.removeLayer(routeLine);
  routeLine = L.polyline(coords, { color, weight: 6 }).addTo(map);
  map.fitBounds(routeLine.getBounds());
  rutaActualCoords = coords;
  window.rutaActual = { coords, color };
}

function setRutaSeleccionadaLine(coords) {
  if (rutaSeleccionadaLine) map.removeLayer(rutaSeleccionadaLine);
  rutaSeleccionadaLine = L.polyline(coords, { color: 'red', weight: 6 }).addTo(map);
  map.fitBounds(rutaSeleccionadaLine.getBounds());
  rutaActualCoords = coords;
  window.rutaActual = { coords, color: 'red' };
}

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
    maximumAge: 0
  };

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
    maximumAge: 60000
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

async function inicializarAplicacion() {
  console.log("🚀 Inicializando aplicación...");
  mostrarEstadoCarga(`🔄 Cargando datos del mapa...`);
  
  try {
    const [zonasData, peligroData] = await Promise.all([
      cargarZonasSeguras(map),
      cargarZonasPeligro(map)
    ]);
    
    const response = await fetch('./data/zonas_seguras.geojson');
    zonasGeoJSON = await response.json();
    peligroGeoJSON = peligroData;
    window.zonasSeguras = zonasGeoJSON.features;
    
    console.log("✓ Zonas seguras cargadas:", zonasGeoJSON.features.length);
    mostrarEstadoCarga(`✓ Datos cargados`);
    
    await cargarCapasAdicionales();
    
    datosListos = true;
    console.log("✓ Todos los datos cargados");
    
    iniciarGelocalizacion();
    
  } catch (error) {
    console.error("Error cargando datos:", error);
    mostrarEstadoCarga(`❌ Error cargando datos`);
    
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

    // Cargar Bloque G
    const bloqueGResponse = await fetch('./data/bloque_g.geojson');
    const bloqueGData = await bloqueGResponse.json();
    L.geoJSON(bloqueGData, {
      style: {
        fillColor: '#861bffff',
        weight: 2,
        opacity: 1,
        color: '#1e40af',
        fillOpacity: 0.4
      },
    }).addTo(map);

    // Cargar Bloque H
    const bloqueHResponse = await fetch('./data/bloque_h.geojson');
    const bloqueHData = await bloqueHResponse.json();
    L.geoJSON(bloqueHData, {
      style: {
        fillColor: '#ec0c66ff',
        weight: 2,
        opacity: 1,
        color: '#1e40af',
        fillOpacity: 0.4
      },
    }).addTo(map);

    // Cargar Escaleras Bloque G
    const gradasResponse = await fetch('./data/gradas_bloque_g.geojson');
    const gradasData = await gradasResponse.json();
    L.geoJSON(gradasData, {
      style: {
        fillColor: '#f59e0b',
        weight: 3,
        opacity: 1,
        color: '#d97706',
        fillOpacity: 0.6,
        dashArray: '5,5'
      },
    }).addTo(map);
    
    console.log("✓ Capas adicionales cargadas");
  } catch (error) {
    console.warn("Advertencia cargando capas adicionales:", error);
  }
}

// EVENTO DE CLIC EN EL MAPA (corregido)
map.on('click', (e) => {
  console.log("👆 Clic manual en mapa:", e.latlng);
  
  // PRIMERO: Establecer nueva ubicación (esto limpia la anterior)
  setUserMarker(e.latlng, "📍 Ubicación seleccionada manualmente");
  
  // SEGUNDO: El sistema de detección procesará la nueva ubicación
  // (ya se llama desde setUserMarker)
});

// BOTÓN CALCULAR RUTA (corregido)
document.getElementById("btn-calcular-ruta").addEventListener("click", async () => {
  console.log("🧮 Iniciando cálculo de ruta...");
  mostrarEstadoCarga(`🧮 Calculando rutas...`);
  
  if (!ultimaUbicacion) {
    alert("❌ Selecciona una ubicación primero.");
    return;
  }

  // Verificar si está en Bloque G ACTUALMENTE
  if (window.bloqueActual && window.bloqueActual.codigo === 'G') {
    console.log("🚨 Usuario en Bloque G - Activando protocolo de evacuación");
    await calcularRutaEvacuacionBloqueG();
    return;
  }

  // Código original para ubicaciones que NO son Bloque G
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

    // Alerta normal para ubicaciones que NO son Bloque G
    reproducirAlertaVozNormal();

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
    agregarEventoSeleccionTabla(resultados);
    
  } catch (error) {
    console.error("❌ Error calculando ruta:", error);
    mostrarEstadoCarga(`❌ Error en cálculo`);
    alert("❌ Error al calcular la ruta. Inténtalo de nuevo.");
  }
});

// FUNCIÓN ESPECÍFICA SOLO PARA BLOQUE G
async function calcularRutaEvacuacionBloqueG() {
  try {
    mostrarEstadoCarga(`🚨 Activando protocolo de evacuación Bloque G...`);
    
    const response = await fetch('./data/rutas_ESPE.geojson');
    const rutasData = await response.json();
    
    const rutaEvacuacion = rutasData.features.find(feature => 
      feature.properties.type === 'evacuation' && 
      feature.properties.building === 'Bloque G'
    );
    
    if (rutaEvacuacion) {
      const coordenadas = rutaEvacuacion.geometry.coordinates;
      const puntos = coordenadas.map(c => [c[1], c[0]]);
      
      setRouteLine(puntos, 'red');
      
      const props = rutaEvacuacion.properties;
      const resultadoEvacuacion = [{
        nombre: props.destination || "Punto Seguro",
        distancia: parseFloat(props.distance?.replace(' metros', '')) || 85,
        duracion: convertirTiempoASegundos(props.time || "2-3 minutos"),
        riesgo: 0.1,
        giros: props.instructions?.length || 8,
        costo: 0.1
      }];
      
      actualizarTablaEvacuacion(resultadoEvacuacion, props);
      mostrarEstadoCarga(`🚨 Protocolo de evacuación Bloque G activado`);
      console.log("✅ Ruta de evacuación del Bloque G cargada");
      
      // ALERTA ESPECÍFICA SOLO PARA BLOQUE G
      reproducirAlertaEvacuacionBloqueG();
      
    } else {
      console.warn("⚠️ Ruta de evacuación no encontrada en rutas_ESPE.geojson");
      usarRutaEvacuacionFallback();
    }
    
  } catch (error) {
    console.error("❌ Error cargando ruta de evacuación:", error);
    mostrarEstadoCarga(`❌ Error cargando evacuación`);
    usarRutaEvacuacionFallback();
  }
}

function usarRutaEvacuacionFallback() {
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
  
  setRouteLine(coordenadasRuta, 'red');
  
  const resultadoFallback = [{
    nombre: "Punto Seguro",
    distancia: 85,
    duracion: 180,
    riesgo: 0.1,
    giros: 8,
    costo: 0.1
  }];
  
  actualizarTablaEvacuacion(resultadoFallback, {
    name: "Evacuación Bloque G",
    origin: "Bloque G - Piso 3",
    destination: "Punto Seguro",
    time: "2-3 minutos",
    distance: "85 metros"
  });
  
  reproducirAlertaEvacuacionBloqueG();
  mostrarEstadoCarga(`🚨 Protocolo de evacuación Bloque G activado`);
}

function actualizarTablaEvacuacion(resultados, props) {
  const tbody = document.querySelector("#tabla-resultados tbody");
  tbody.innerHTML = "";
  
  const resultado = resultados[0];
  const row = document.createElement("tr");
  row.classList.add("ruta-evacuacion", "mejor-opcion");
  
  const duracionMin = Math.floor(resultado.duracion / 60);
  const duracionSeg = Math.floor(resultado.duracion % 60);
  const duracionTexto = `${duracionMin}:${duracionSeg.toString().padStart(2, '0')}`;
  
  row.innerHTML = `
    <td class="zona-nombre">
      <span style="color: #dc2626; font-weight: bold;">🚨 ${resultado.nombre}</span>
    </td>
    <td class="distancia">${(resultado.distancia / 1000).toFixed(2)} km</td>
    <td class="duracion">${duracionTexto}</td>
    <td class="riesgo riesgo-bajo">
      <span class="riesgo-badge" style="background: #10b981;">SEGURA</span>
    </td>
    <td class="giros">${resultado.giros}</td>
    <td class="costo">
      <span class="costo-badge mejor-ruta" style="background: #dc2626;">EVACUACIÓN</span>
    </td>
  `;
  
  tbody.appendChild(row);
  
  const infoRow = document.createElement("tr");
  infoRow.innerHTML = `
    <td colspan="6" style="background: #fee2e2; padding: 12px; border-left: 4px solid #dc2626;">
      <strong>🚨 RUTA DE EVACUACIÓN ACTIVA</strong><br>
      <small>Origen: ${props.origin || "Bloque G - Piso 3"} → Destino: ${props.destination || "Punto Seguro"}</small>
    </td>
  `;
  tbody.appendChild(infoRow);
}

function convertirTiempoASegundos(tiempo) {
  if (tiempo.includes("minuto")) {
    const nums = tiempo.match(/\d+/g);
    if (nums && nums.length > 0) {
      return parseInt(nums[0]) * 60;
    }
  }
  return 180;
}

// ALERTA DE VOZ ESPECÍFICA SOLO PARA BLOQUE G
function reproducirAlertaEvacuacionBloqueG() {
  const mensaje = "Evacuación activada desde Bloque G. Diríjase inmediatamente a las gradas siguiendo las instrucciones en pantalla.";
  
  const utter = new window.SpeechSynthesisUtterance(mensaje);
  utter.lang = "es-ES";
  utter.rate = 0.8;
  utter.pitch = 1.2;
  utter.volume = 0.9;
  
  utter.onstart = function() {
    mostrarModalEvacuacionBloqueG();
  };
  
  window.speechSynthesis.speak(utter);
}

// ALERTA DE VOZ NORMAL para ubicaciones que NO son Bloque G
function reproducirAlertaVozNormal() {
  const mensaje = "Erupción volcánica detectada, sigue la ruta más segura según tu ubicación";
  
  const utter = new window.SpeechSynthesisUtterance(mensaje);
  utter.lang = "es-ES";
  utter.rate = 1.0;
  utter.pitch = 1.0;
  utter.volume = 0.8;
  
  window.speechSynthesis.speak(utter);
}

function reproducirAlertaVoz() {
  const mensaje = "Erupción volcánica detectada, sigue la ruta más segura según tu ubicación";
  for (let i = 0; i < 2; i++) {
    const utter = new window.SpeechSynthesisUtterance(mensaje);
    utter.lang = "es-ES";
    window.speechSynthesis.speak(utter);
  }
}

// MODAL ESPECÍFICO SOLO PARA BLOQUE G
function mostrarModalEvacuacionBloqueG() {
  const existente = document.getElementById('modal-evacuacion-bloque-g');
  if (existente) {
    existente.remove();
  }
  
  const modal = document.createElement('div');
  modal.id = 'modal-evacuacion-bloque-g';
  modal.className = 'modal-evacuacion-overlay';
  
  modal.innerHTML = `
    <div class="modal-evacuacion-contenido">
      <div class="modal-header-evacuacion">
        <h2>🚨 EVACUACIÓN BLOQUE G ACTIVADA</h2>
        <p class="origen-destino">Bloque G - Piso 3 → Punto Seguro</p>
      </div>
      
      <div class="modal-body-evacuacion">
        <div class="instruccion-principal">
          <h3>📍 DIRÍJASE INMEDIATAMENTE A LAS GRADAS</h3>
        </div>
        
        <div class="instrucciones-paso">
          <h4>🚶‍♂️ SIGA ESTOS PASOS:</h4>
          <ol>
            <li><span class="numero-paso">1</span> Sal del aula hacia el pasillo principal</li>
            <li><span class="numero-paso">2</span> Gira a mano derecha en el pasillo</li>
            <li><span class="numero-paso">3</span> <strong>Camina 10 metros hasta LAS GRADAS</strong></li>
            <li><span class="numero-paso">4</span> Baja del Piso 3 al Piso 2 por las gradas</li>
            <li><span class="numero-paso">5</span> Continúa bajando del Piso 2 al Piso 1</li>
            <li><span class="numero-paso">6</span> Camina 20 metros hacia la salida trasera</li>
            <li><span class="numero-paso">7</span> Sal por la puerta trasera del edificio</li>
            <li><span class="numero-paso">8</span> Dirígete al punto seguro (área verde)</li>
          </ol>
        </div>
        
        <div class="advertencias">
          <h4>⚠️ IMPORTANTE:</h4>
          <ul>
            <li>🚫 <strong>NO uses el ascensor</strong></li>
            <li>🚶‍♂️ Mantén la calma y no corras</li>
            <li>🤝 Ayuda a personas con dificultades</li>
            <li>📱 Una vez en el punto seguro, reporta tu estado</li>
          </ul>
        </div>
        
        <div class="tiempo-estimado">
          <div class="tiempo-badge">
            ⏱️ Tiempo estimado: <strong>2-3 minutos</strong>
          </div>
          <div class="distancia-badge">
            📏 Distancia: <strong>85 metros</strong>
          </div>
        </div>
      </div>
      
      <div class="modal-footer-evacuacion">
        <button onclick="cerrarModalEvacuacionBloqueG()" class="btn-entendido">
          ✓ ENTENDIDO - COMENZAR EVACUACIÓN
        </button>
        <button onclick="repetirInstruccionesBloqueG()" class="btn-repetir">
          🔊 REPETIR INSTRUCCIONES
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  setTimeout(() => {
    if (document.getElementById('modal-evacuacion-bloque-g')) {
      cerrarModalEvacuacionBloqueG();
    }
  }, 30000);
}

function cerrarModalEvacuacionBloqueG() {
  const modal = document.getElementById('modal-evacuacion-bloque-g');
  if (modal) {
    modal.classList.add('modal-closing');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

function repetirInstruccionesBloqueG() {
  const mensaje = "Instrucciones de evacuación Bloque G: Sal del aula, gira a la derecha, camina diez metros hasta las gradas, baja del piso tres al piso dos, continúa al piso uno, camina veinte metros a la salida trasera, sal del edificio y dirígete al punto seguro.";
  
  const utter = new window.SpeechSynthesisUtterance(mensaje);
  utter.lang = "es-ES";
  utter.rate = 0.7;
  utter.pitch = 1.0;
  utter.volume = 1.0;
  
  window.speechSynthesis.speak(utter);
}

window.cerrarModalEvacuacionBloqueG = cerrarModalEvacuacionBloqueG;
window.repetirInstruccionesBloqueG = repetirInstruccionesBloqueG;

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
        if (filaSeleccionada) filaSeleccionada.classList.remove("fila-seleccionada");
        row.classList.add("fila-seleccionada");
        filaSeleccionada = row;

        if (rutaSeleccionadaLine) {
          map.removeLayer(rutaSeleccionadaLine);
          rutaSeleccionadaLine = null;
        }

        const ruta = await obtenerRutaDesdeORS(ultimaUbicacion, resultados[idx].coords);
        if (!ruta) return;
        const puntos = ruta.geometry.coordinates.map(c => [c[1], c[0]]);
        setRutaSeleccionadaLine(puntos);
      };
    }
  });
}

document.getElementById("btn-centrar-ubicacion").addEventListener("click", () => {
  if (ultimaUbicacion) {
    map.setView(ultimaUbicacion, 18);
    if (userMarker) userMarker.openPopup();
  } else {
    iniciarGelocalizacion();
  }
});

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(pos => {
    const userPos = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    };
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

function obtenerIndicacion(userPos, rutaCoords) {
  let minDist = Infinity, idx = 0;
  for (let i = 0; i < rutaCoords.length; i++) {
    const d = distancia(userPos, { lat: rutaCoords[i][0], lng: rutaCoords[i][1] });
    if (d < minDist) {
      minDist = d;
      idx = i;
    }
  }
  if (idx >= rutaCoords.length - 2 && minDist < 0.0002) return "Has llegado a la zona segura";
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

function distancia(a, b) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

let ultimaIndicacion = "";
function reproducirIndicacionVoz(texto) {
  if (texto === ultimaIndicacion) return;
  ultimaIndicacion = texto;
  const utter = new window.SpeechSynthesisUtterance(texto);
  utter.lang = "es-ES";
  window.speechSynthesis.speak(utter);
}

// Estilos CSS
const estilosEvacuacion = document.createElement('style');
estilosEvacuacion.textContent = `
.simple-user-marker {
  /* Sin animaciones */
}

#loading-indicator {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: 500;
}

.ruta-evacuacion {
  background-color: #fef2f2 !important;
  border-left: 4px solid #dc2626 !important;
}

.ruta-evacuacion:hover {
  background-color: #fee2e2 !important;
}

.modal-evacuacion-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50000;
  animation: modalFadeIn 0.3s ease-out;
}

.modal-evacuacion-contenido {
  background: linear-gradient(135deg, #ffffff, #fef7f7);
  border-radius: 16px;
  padding: 0;
  max-width: 600px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  border: 3px solid #dc2626;
  animation: modalSlideUp 0.4s ease-out;
}

.modal-header-evacuacion {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  padding: 20px;
  border-radius: 13px 13px 0 0;
  text-align: center;
  border-bottom: 3px solid #991b1b;
}

.modal-header-evacuacion h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.origen-destino {
  margin: 0;
  font-size: 16px;
  opacity: 0.95;
  background: rgba(255,255,255,0.1);
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
}

.modal-body-evacuacion {
  padding: 24px;
}

.instruccion-principal {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  border: 2px solid #f87171;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: center;
}

.instruccion-principal h3 {
  margin: 0;
  color: #dc2626;
  font-size: 20px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.instrucciones-paso {
  margin-bottom: 20px;
}

.instrucciones-paso h4 {
  color: #1f2937;
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: bold;
}

.instrucciones-paso ol {
  list-style: none;
  padding: 0;
  margin: 0;
}

.instrucciones-paso li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  background: #000000ff;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
  transition: all 0.2s ease;
}

.instrucciones-paso li:hover {
  background: #000000ff;
  transform: translateX(4px);
}

.numero-paso {
  background: #3b82f6;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
  margin-right: 12px;
  flex-shrink: 0;
}

.advertencias {
  background: #fffbeb;
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.advertencias h4 {
  color: #92400e;
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: bold;
}

.advertencias ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.advertencias li {
  margin-bottom: 8px;
  color: #78350f;
  font-weight: 500;
}

.tiempo-estimado {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.tiempo-badge, .distancia-badge {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 10px 16px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.modal-footer-evacuacion {
  padding: 20px 24px;
  background: #f9fafb;
  border-radius: 0 0 13px 13px;
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-entendido {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  flex: 1;
  max-width: 280px;
}

.btn-entendido:hover {
  background: linear-gradient(135deg, #b91c1c, #991b1b);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
}

.btn-repetir {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-repetir:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.modal-closing {
  animation: modalFadeOut 0.3s ease-in forwards;
}

@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalSlideUp {
  from {
    transform: translateY(50px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes modalFadeOut {
  from { 
    opacity: 1;
    transform: scale(1);
  }
  to { 
    opacity: 0;
    transform: scale(0.95);
  }
}

@media (max-width: 600px) {
  .modal-evacuacion-contenido {
    width: 98%;
    margin: 10px;
  }
  
  .modal-header-evacuacion h2 {
    font-size: 20px;
  }
  
  .instruccion-principal h3 {
    font-size: 18px;
  }
  
  .tiempo-estimado {
    flex-direction: column;
  }
  
  .modal-footer-evacuacion {
    flex-direction: column;
  }
  
  .btn-entendido, .btn-repetir {
    max-width: none;
  }
}
`;

document.head.appendChild(estilosEvacuacion);

// Integración con detección de bloques
document.addEventListener('bloqueDetectado', function(e) {
    const bloque = e.detail;
    console.log(`✅ Usuario ubicado en ${bloque.nombre}`);
    
    window.bloqueActual = bloque;
    
    if (bloque.codigo === 'G') {
        console.log('🚨 Bloque G detectado - Ruta de evacuación disponible');
    }
});

window.map = map;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarAplicacion);
} else {
  inicializarAplicacion();
}