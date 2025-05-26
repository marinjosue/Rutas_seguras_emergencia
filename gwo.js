export async function evaluarRutasConGWO(origen, zonasGeoJSON, peligroGeoJSON, apiKey) {
    const zonas = zonasGeoJSON.features.map((f, i) => ({
    nombre: f.properties.nombre || `Zona ${i + 1}`,
    coords: {
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0]
    }
    }));

  const resultados = [];

  for (let zona of zonas) {
    const ruta = await obtenerRutaDesdeORS(origen, zona.coords, apiKey);
    if (!ruta || !ruta.summary || !ruta.geometry || !ruta.geometry.coordinates) continue;

    const distancia = ruta.summary.distance;
    const duracion = ruta.summary.duration;
    const giros = contarGiros(ruta.geometry.coordinates);
    let riesgo = calcularProximidadPeligro(ruta.geometry.coordinates, peligroGeoJSON);

    if (duracion > 1800) {
      riesgo += 0.5;
    }

    resultados.push({
      nombre: zona.nombre,
      coords: zona.coords,
      distancia,
      duracion,
      giros,
      riesgo
    });
  }

  if (resultados.length === 0) return [];

  return aplicarGWO(resultados);
}

async function obtenerRutaDesdeORS(from, to, apiKey) {
  const url = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";
  const headers = {
    'Authorization': apiKey,
    'Content-Type': 'application/json'
  };
  const body = {
    coordinates: [
      [from.lng, from.lat],
      [to.lng, to.lat]
    ]
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return {
      geometry: data.features[0].geometry,
      summary: data.features[0].properties.summary
    };
  } catch (err) {
    console.error("Error en ORS:", err);
    return null;
  }
}

function contarGiros(coords) {
  let giros = 0;
  for (let i = 2; i < coords.length; i++) {
    const [x1, y1] = coords[i - 2];
    const [x2, y2] = coords[i - 1];
    const [x3, y3] = coords[i];
    const ang1 = Math.atan2(y2 - y1, x2 - x1);
    const ang2 = Math.atan2(y3 - y2, x3 - x2);
    const diff = Math.abs(ang2 - ang1);
    if (diff > Math.PI / 4) giros++;
  }
  return giros;
}

function calcularProximidadPeligro(coords, peligroGeoJSON) {
  if (typeof turf === "undefined") {
    console.warn("Turf.js no está cargado. Se usa riesgo aleatorio.");
    return Math.random();
  }

  const line = turf.lineString(coords);
  const zone = turf.featureCollection(peligroGeoJSON.features);

  let intersects = false;
  let distanciaMinima = Infinity;

  for (let zona of zone.features) {
    if (turf.booleanIntersects(line, zona)) {
      intersects = true;
    }
    const distancia = turf.pointToLineDistance(
      turf.centroid(zona),
      line,
      { units: 'kilometers' }
    );
    distanciaMinima = Math.min(distanciaMinima, distancia);
  }

  if (intersects) return 1.0;            
  if (distanciaMinima < 0.1) return 0.8; 
  return 0.1;                           
}

function aplicarGWO(resultados) {
  const keys = ['distancia', 'duracion', 'riesgo', 'giros'];
  const mins = {}, maxs = {};

  keys.forEach(k => {
    mins[k] = Math.min(...resultados.map(r => r[k]));
    maxs[k] = Math.max(...resultados.map(r => r[k]));
  });

  for (let r of resultados) {
    keys.forEach(k => {
      r[k + '_norm'] = (r[k] - mins[k]) / (maxs[k] - mins[k] || 1);
    });

    const w1 = 0.4, w2 = 0.4, w3 = 0.15, w4 = 0.05;
    r.costo = (
      w1 * r.distancia_norm +
      w2 * r.duracion_norm +
      w3 * r.riesgo_norm +
      w4 * r.giros_norm
    );
  }

  return resultados.sort((a, b) => a.costo - b.costo);
}