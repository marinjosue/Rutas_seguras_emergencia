import { evaluarRutasConGWO } from './gwo.js';
import { obtenerRutaDesdeORS, limpiarCoordenadas, actualizarTabla } from './main-utils.js';

const API_KEY = '5b3ce3597851110001cf6248b974c94f93f54bd1abc4a50eef7cde3b';

export async function detectarUbicacion(map, zonasGeoJSON, peligroGeoJSON, setUserMarker, setRouteLine) {
  if (!navigator.geolocation) {
    alert("La geolocalización no está disponible en este navegador.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const coords = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    };

    if (!zonasGeoJSON || !peligroGeoJSON) {
      alert("Datos de zonas aún no están cargados.");
      return;
    }

    // Dibujar marcador de ubicación actual
    setUserMarker(coords, "Ubicación actual");

    // Calcular rutas
    const resultados = await evaluarRutasConGWO(coords, zonasGeoJSON, peligroGeoJSON, API_KEY);
    if (!resultados || resultados.length === 0) {
      alert("No se pudo calcular la ruta desde tu ubicación.");
      return;
    }

    // Dibujar mejor ruta
    const mejor = resultados[0];
    const ruta = await obtenerRutaDesdeORS(coords, mejor.coords, API_KEY);
    if (!ruta) return;

    const puntos = limpiarCoordenadas(ruta.geometry.coordinates).map(c => [c[1], c[0]]);
    setRouteLine(puntos);
    map.fitBounds(puntos);

    // Mostrar tabla
    actualizarTabla(resultados);
  }, () => {
    alert("No se pudo obtener tu ubicación. Activa permisos de geolocalización.");
  });
}