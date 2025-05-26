export async function cargarZonasSeguras(map) {
  const res = await fetch('data/zonas_seguras.geojson');
  const data = await res.json();
  L.geoJSON(data, {
    onEachFeature: (feature, layer) => {
      layer.bindPopup("Zona segura: " + feature.properties.nombre);
      const coords = layer.getLatLng();
      L.circle(coords, {
        radius: 30,
        color: 'green',
        fillColor: '#0f0',
        fillOpacity: 0.2
      }).addTo(map);
    },
    pointToLayer: (feature, latlng) => {
      return L.marker(latlng, {
        icon: L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        })
      });
    }
  }).addTo(map);
  return data;
}

export async function cargarZonasPeligro(map) {
  const res = await fetch('data/peligro_lahar.geojson');
  const data = await res.json();
  L.geoJSON(data, {
    style: {
      color: 'red',
      fillColor: 'red',
      weight: 1,
      fillOpacity: 0.5
    }
  }).addTo(map);
  return data;
}

export function actualizarTabla(resultados) {
  const tbody = document.querySelector("#tabla-resultados tbody");
  tbody.innerHTML = "";

  if (!resultados || resultados.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="6" class="no-results">
        No se encontraron rutas válidas
      </td>
    `;
    tbody.appendChild(row);
    return;
  }

  resultados.forEach((r, index) => {
    const row = document.createElement("tr");
    
    // Determinar clase de riesgo
    let claseRiesgo = 'riesgo-bajo';
    if (r.riesgo > 0.7) claseRiesgo = 'riesgo-alto';
    else if (r.riesgo > 0.3) claseRiesgo = 'riesgo-medio';
    
    // Formatear duración en formato legible
    const duracionMin = Math.floor(r.duracion / 60);
    const duracionSeg = Math.floor(r.duracion % 60);
    const duracionFormateada = duracionMin > 0 ? 
      `${duracionMin}m ${duracionSeg}s` : 
      `${duracionSeg}s`;
    
    // Crear badges para valores importantes
    const badgeRiesgo = r.riesgo > 0.7 ? 'badge-danger' : 
                        r.riesgo > 0.3 ? 'badge-warning' : 'badge-success';
    
    const badgeCosto = index === 0 ? 'badge-success' : 
                       index === 1 ? 'badge-warning' : '';
    
    row.innerHTML = `
      <td><strong>${r.nombre}</strong></td>
      <td>${r.distancia.toFixed(0)}</td>
      <td>${duracionFormateada}</td>
      <td class="${claseRiesgo}">
        <span class="badge ${badgeRiesgo}">${r.riesgo.toFixed(2)}</span>
      </td>
      <td>${r.giros}</td>
      <td>
        <span class="badge ${badgeCosto}">
          <strong>${r.costo.toFixed(3)}</strong>
        </span>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}