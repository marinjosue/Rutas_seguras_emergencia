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

function setUserMarker(coords, texto = "Tu ubicación") {
  if (userMarker) map.removeLayer(userMarker);
  userMarker = L.marker(coords).addTo(map).bindPopup(texto).openPopup();
  ultimaUbicacion = coords;
  document.getElementById("btn-calcular-ruta").disabled = false;
}

// Cambia: permite color personalizado
function setRouteLine(coords, color = 'blue') {
  if (routeLine) map.removeLayer(routeLine);
  routeLine = L.polyline(coords, { color, weight: 6 }).addTo(map);
  map.fitBounds(routeLine.getBounds());
  rutaActualCoords = coords;
}

// Nueva función para ruta seleccionada (color rojo)
function setRutaSeleccionadaLine(coords) {
  if (rutaSeleccionadaLine) map.removeLayer(rutaSeleccionadaLine);
  rutaSeleccionadaLine = L.polyline(coords, { color: 'red', weight: 6 }).addTo(map);
  map.fitBounds(rutaSeleccionadaLine.getBounds());
  rutaActualCoords = coords;
}

Promise.all([
  cargarZonasSeguras(map),
  cargarZonasPeligro(map)
]).then(([zonas, peligro]) => {
  zonasGeoJSON = zonas;
  peligroGeoJSON = peligro;

  // Cargar zona_ESPE.geojson (contorno azul)
  fetch('data/zona_ESPE.geojson')
    .then(res => res.json())
    .then(data => {
      L.geoJSON(data, {
        style: {
          color: '#1E90FF',
          fillColor: '#E0F0FF',
          weight: 2,
          fillOpacity: 0.3
        }
      }).addTo(map);
    });

  // Cargar rutas_ESPE.geojson (líneas verdes)
  fetch('data/rutas_ESPE.geojson')
    .then(res => res.json())
    .then(data => {
      L.geoJSON(data, {
        style: {
          color: '#1FAA59',
          weight: 2
        }
      }).addTo(map);
    });

  // Geolocalización automática
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
      setUserMarker(coords, "Ubicación actual");
    });
  }
});

// Evento: clic manual en el mapa
map.on('click', (e) => {
  setUserMarker(e.latlng);
});

// Botón CALCULAR RUTA
document.getElementById("btn-calcular-ruta").addEventListener("click", async () => {
  if (!ultimaUbicacion) return alert("Selecciona una ubicación primero.");

  const resultados = await evaluarRutasConGWO(ultimaUbicacion, zonasGeoJSON, peligroGeoJSON, API_KEY);
  if (!resultados || resultados.length === 0) {
    alert("No se encontraron rutas válidas.");
    return;
  }

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
    map.setView(ultimaUbicacion, 16);
    if (userMarker) userMarker.openPopup();
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
