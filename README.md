# Sistema de Rutas de Evacuación con Algoritmo GWO

## 📋 Descripción del Proyecto

Este proyecto es un sistema web interactivo de planificación de rutas de evacuación para emergencias volcánicas, desarrollado para la Universidad de las Fuerzas Armadas ESPE. Utiliza el algoritmo **Grey Wolf Optimizer (GWO)** para encontrar las rutas más seguras hacia zonas de evacuación, considerando múltiples factores como distancia, tiempo, riesgo y complejidad del recorrido.

## 🎯 Objetivos

- **Objetivo Principal**: Proporcionar un sistema de navegación segura durante emergencias volcánicas
- **Objetivos Específicos**:
  - Calcular rutas óptimas usando algoritmos de optimización
  - Evaluar el riesgo de las rutas en tiempo real
  - Proporcionar indicaciones de voz para la navegación
  - Visualizar zonas seguras y peligrosas en un mapa interactivo

## 🏗️ Estructura del Proyecto

```
Rutas_seguras_emergencia/
├── index.html                 # Página principal de la aplicación
├── README.md                 # Documentación del proyecto
├── css/
│   └── style.css            # Estilos de la aplicación
├── js/
│   ├── main.js              # Lógica principal y manejo del mapa
│   ├── gwo.js               # Implementación del algoritmo GWO
│   ├── rutas.js             # Carga de datos geográficos
│   ├── ubicacion.js         # Detección automática de ubicación
│   └── main-utils.js        # Utilidades compartidas
├── data/
│   ├── zonas_seguras.geojson    # Puntos de evacuación seguros
│   ├── zonas_peligro.geojson    # Áreas de riesgo volcánico
│   ├── zona_ESPE.geojson        # Perímetro del campus ESPE
│   └── rutas_ESPE.geojson       # Rutas predefinidas del campus
└── img/
    └── ubicacion.png            # Íconos para marcadores
```

## 🚀 Características Principales

### 1. **Algoritmo Grey Wolf Optimizer (GWO)**
- Optimización multiobjetivo para selección de rutas
- Factores evaluados:
  - **Distancia** (40%): Longitud total del recorrido
  - **Tiempo** (40%): Duración estimada del viaje
  - **Riesgo** (15%): Proximidad a zonas peligrosas
  - **Complejidad** (5%): Número de giros en la ruta

### 2. **Interfaz de Usuario Interactiva**
- Mapa interactivo con Leaflet.js
- Selección manual de ubicación mediante clic
- Geolocalización automática del usuario
- Tabla de resultados con rutas ordenadas por seguridad

### 3. **Sistemas de Navegación**
- Indicaciones de voz en español
- Seguimiento en tiempo real de la ubicación
- Alertas automáticas de emergencia
- Visualización de rutas con diferentes colores

### 4. **Datos Geográficos**
- Zonas seguras de evacuación
- Áreas de riesgo volcánico
- Contorno del campus universitario
- Rutas predefinidas del campus

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura de la aplicación
- **CSS3**: Estilos y responsive design
- **JavaScript ES6+**: Lógica de la aplicación
- **Leaflet.js**: Mapas interactivos
- **Turf.js**: Análisis geoespacial

### APIs y Servicios
- **OpenRouteService**: Cálculo de rutas peatonales
- **Geolocation API**: Detección de ubicación del usuario
- **Speech Synthesis API**: Indicaciones de voz

### Algoritmos
- **Grey Wolf Optimizer**: Optimización de rutas
- **Análisis geoespacial**: Cálculo de riesgos y proximidades

## 📱 Funcionalidades

### Detección de Ubicación
```javascript
// Geolocalización automática al cargar
navigator.geolocation.getCurrentPosition(callback);

// Seguimiento continuo para navegación
navigator.geolocation.watchPosition(callback);
```

### Cálculo de Rutas
```javascript
// Evaluación con algoritmo GWO
const resultados = await evaluarRutasConGWO(
  ubicacionUsuario, 
  zonasSeguras, 
  zonasPeligro, 
  API_KEY
);
```

### Indicaciones de Voz
```javascript
// Alertas de emergencia
speechSynthesis.speak(new SpeechSynthesisUtterance(mensaje));

// Navegación paso a paso
reproducirIndicacionVoz("Gira a la izquierda");
```

## 🔧 Instalación y Configuración

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet para APIs externas
- Permisos de geolocalización activados

### Configuración
1. **Clonar o descargar** el proyecto
2. **Configurar API Key** de OpenRouteService en `main.js` y `gwo.js`:
   ```javascript
   const API_KEY = 'tu_api_key_aqui';
   ```
3. **Verificar rutas** de archivos GeoJSON en la carpeta `data/`
4. **Abrir** `index.html` en un navegador web

### Estructura de APIs
```javascript
// OpenRouteService para rutas
const API_ENDPOINT = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";

// Headers requeridos
headers: {
  'Authorization': API_KEY,
  'Content-Type': 'application/json'
}
```

## 📊 Algoritmo GWO - Detalles Técnicos

### Función de Costo
```javascript
costo = 0.4 * distancia_normalizada + 
        0.4 * tiempo_normalizado + 
        0.15 * riesgo_normalizado + 
        0.05 * giros_normalizados
```

### Evaluación de Riesgo
- **Riesgo Alto (1.0)**: Ruta intersecta zona peligrosa
- **Riesgo Medio (0.8)**: Ruta a menos de 100m de zona peligrosa  
- **Riesgo Bajo (0.1)**: Ruta alejada de zonas peligrosas

### Normalización de Datos
```javascript
valor_normalizado = (valor - valor_minimo) / (valor_maximo - valor_minimo)
```

## 🎨 Interfaz de Usuario

### Componentes Principales
- **Mapa Principal**: Visualización de ubicación, rutas y zonas
- **Panel de Control**: Botones para cálculo y centrado
- **Tabla de Resultados**: Comparación de rutas evaluadas
- **Indicadores Visuales**: Colores para diferentes tipos de información

### Código de Colores
- **Azul**: Ruta recomendada principal
- **Rojo**: Ruta seleccionada por el usuario
- **Verde**: Zonas seguras de evacuación
- **Rojo/Amarillo**: Zonas de peligro volcánico

## 🔍 Casos de Uso

### Escenario 1: Evacuación de Emergencia
1. El sistema detecta la ubicación del usuario automáticamente
2. Se reproduce alerta de voz sobre erupción volcánica
3. Se calculan y muestran las 3 mejores rutas de evacuación
4. El usuario selecciona una ruta y recibe navegación paso a paso

### Escenario 2: Planificación Preventiva
1. El usuario hace clic en una ubicación específica del mapa
2. Se calculan rutas desde ese punto hacia zonas seguras
3. Se evalúan y comparan diferentes opciones
4. Se puede simular la navegación antes de una emergencia real

## 🚨 Consideraciones de Seguridad

- **Validación de datos**: Verificación de coordenadas y respuestas de API
- **Manejo de errores**: Recuperación en caso de fallas de conectividad
- **Alertas redundantes**: Múltiples canales de notificación (visual, auditivo)
- **Rutas alternativas**: Siempre se proporcionan múltiples opciones

## 📈 Posibles Mejoras Futuras

- Integración con sistemas de alerta temprana
- Actualización en tiempo real de condiciones de riesgo
- Soporte para diferentes tipos de emergencias
- Aplicación móvil nativa
- Integración con sistemas de gestión de emergencias institucionales

## 👥 Equipo de Desarrollo

Proyecto desarrollado por Autepin  para la Universidad de las Fuerzas Armadas ESPE como parte del sistema de gestión de emergencias del campus.

## 📄 Licencia

Este proyecto está desarrollado con fines académicos para la Universidad de las Fuerzas Armadas ESPE.