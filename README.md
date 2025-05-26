# Rutas de Evacuación con Algoritmo GWO

## 1. Introducción

### Contexto general del problema o necesidad
Las zonas cercanas a volcanes activos presentan riesgos significativos para la población, especialmente ante la ocurrencia de lahares u otros eventos eruptivos. La evacuación eficiente y segura es fundamental para salvar vidas, pero seleccionar rutas óptimas considerando múltiples factores (distancia, tiempo, riesgo, giros) es un desafío complejo.

### Justificación del proyecto
La toma de decisiones en situaciones de emergencia requiere herramientas que integren información geoespacial y criterios de seguridad. Este proyecto busca proporcionar una solución interactiva y automatizada para la selección de rutas de evacuación óptimas, apoyando a usuarios y autoridades en la gestión de riesgos volcánicos.

### Alcance del trabajo
El sistema desarrollado permite calcular, comparar y visualizar rutas de evacuación desde cualquier punto hacia zonas seguras, considerando zonas de peligro y múltiples criterios de optimización. La solución es extensible a otros escenarios de riesgo y puede integrarse con diferentes fuentes de datos geográficos.

### Breve descripción del enfoque adoptado
Se implementó el algoritmo metaheurístico Grey Wolf Optimizer (GWO) para evaluar y seleccionar rutas óptimas, integrando datos geoespaciales y visualización en tiempo real mediante Leaflet y Turf.js.

## 2. El problema abordado

La necesidad de evacuar rápidamente ante la amenaza de lahares volcánicos exige rutas que minimicen la exposición al peligro, el tiempo y la distancia recorrida, considerando además la facilidad de tránsito (número de giros). Sin una herramienta adecuada, la selección manual de rutas puede ser ineficiente y riesgosa.

## 3. Objetivo del proyecto

### Objetivo general
Desarrollar una herramienta interactiva que calcule y visualice rutas de evacuación óptimas hacia zonas seguras, considerando zonas de peligro y múltiples criterios, para mejorar la toma de decisiones en situaciones de emergencia volcánica.

### Objetivos específicos
- Integrar datos geoespaciales de zonas de riesgo y zonas seguras en un sistema interactivo.
- Implementar el algoritmo GWO para optimizar rutas considerando distancia, duración, riesgo y número de giros.
- Visualizar en tiempo real las rutas evaluadas y la mejor opción en un mapa interactivo.
- Permitir la selección manual o automática de la ubicación del usuario.
- Evaluar el desempeño y la efectividad del sistema en escenarios simulados.

## 4. Descripción del algoritmo seleccionado

### Nombre del algoritmo
Grey Wolf Optimizer (GWO)

### Funcionamiento general
GWO es un algoritmo de optimización inspirado en la jerarquía social y la estrategia de caza de los lobos grises. Simula la persecución y captura de presas, permitiendo explorar y explotar el espacio de soluciones para encontrar óptimos globales.

### Por qué se eligió este algoritmo
GWO es eficiente para problemas multiobjetivo y no requiere derivadas, lo que lo hace adecuado para optimizar rutas considerando criterios heterogéneos y restricciones geoespaciales.

### Ventajas para este caso
- Capacidad de manejar múltiples criterios simultáneamente.
- Flexibilidad para adaptarse a diferentes escenarios y restricciones.
- Facilidad de integración con sistemas de información geográfica.

## 5. Mejoras o adaptaciones realizadas al algoritmo

- **Normalización de criterios:** Todos los factores (distancia, duración, riesgo, giros) se normalizan para comparabilidad.
- **Ponderación ajustable:** Se asignan pesos a cada criterio según su importancia.
- **Cálculo de riesgo geoespacial:** Uso de Turf.js para evaluar proximidad e intersección con zonas de peligro.
- **Integración con Leaflet:** Visualización de rutas, zonas seguras y peligrosas en tiempo real.
- **Optimización de rendimiento:** Selección eficiente de rutas candidatas y actualización dinámica de resultados.

## 6. Desarrollo de la solución

### Descripción del sistema desarrollado
La aplicación web permite al usuario seleccionar su ubicación y calcular rutas de evacuación óptimas hacia zonas seguras, mostrando resultados en una tabla y en el mapa.

### Integración del algoritmo
El GWO evalúa rutas generadas entre el punto de inicio y las zonas seguras, calculando el costo total según los criterios definidos.

### Lógica del flujo general
1. El usuario selecciona su ubicación.
2. El sistema genera rutas candidatas hacia zonas seguras.
3. Para cada ruta, se calculan distancia, duración, riesgo y giros.
4. El GWO normaliza y pondera los criterios, seleccionando la mejor ruta.
5. Se visualizan los resultados en la interfaz.

### Consideraciones técnicas
- Uso de Leaflet para mapas interactivos.
- Turf.js para análisis geoespacial.
- Datos en formato GeoJSON para zonas de riesgo y seguras.
- Interfaz moderna y responsiva.

## 7. Resultados obtenidos

### Capturas de interfaz gráfica

![Interfaz principal](capturas/interfaz_principal.png)
![Tabla de rutas](capturas/tabla_rutas.png)
![Ruta óptima](capturas/ruta_optima.png)

### Comparación antes y después
Antes: Selección manual y subjetiva de rutas, sin considerar todos los factores.
Después: Selección automática y óptima, considerando múltiples criterios y restricciones.

### Análisis de desempeño
- Reducción del tiempo y distancia de evacuación.
- Evitación de zonas de alto riesgo.
- Rutas más directas y seguras.

## 8. Validación de la solución

- El sistema genera rutas que minimizan la exposición a zonas peligrosas y optimizan el tiempo de evacuación.
- Ejemplos prácticos muestran rutas alternativas y la mejor opción según los criterios definidos.
- Limitaciones: Dependencia de la calidad de los datos geoespaciales y de la conectividad de la red vial.

## 9. Conclusiones

1. **El algoritmo GWO permite seleccionar rutas de evacuación óptimas considerando criterios relevantes para la seguridad.**
2. **La integración de datos geoespaciales y visualización en tiempo real facilita la toma de decisiones rápidas y fundamentadas.**
3. **El sistema es flexible y puede adaptarse a diferentes escenarios de riesgo y tipos de amenazas.**
4. **La automatización reduce errores humanos y mejora la eficiencia en situaciones críticas.**

## 10. Recomendaciones

- Integrar datos de tráfico en tiempo real para mejorar la precisión de las rutas.
- Ampliar el sistema para otros tipos de desastres naturales.
- Desarrollar una versión móvil para acceso rápido en campo.
- Realizar pruebas con usuarios finales para validar la usabilidad y efectividad.

---

*Este proyecto demuestra que la combinación de algoritmos metaheurísticos y tecnologías de mapas interactivos es una solución efectiva para problemas complejos de evacuación y gestión de riesgos.*
