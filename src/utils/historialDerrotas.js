/**
 * Módulo para gestionar el historial de derrotas en el Buscaminas Inverso
 * Permite almacenar y analizar patrones de posiciones con minas
 * para mejorar las decisiones futuras
 */

// Clave para almacenamiento local
const STORAGE_KEY = 'buscaminas_historial_derrotas';

/**
 * Cargar el historial de derrotas desde el almacenamiento local
 * @returns {Array} - Array de objetos {fila, columna, veces} con las posiciones donde se encontraron minas
 */
export const cargarHistorialDerrotas = () => {
    try {
        const historialGuardado = localStorage.getItem(STORAGE_KEY);
        if (historialGuardado) {
            return JSON.parse(historialGuardado);
        }
    } catch (error) {
        console.error("Error al cargar historial de derrotas:", error);
    }
    return [];
};

/**
 * Registrar una derrota en el historial
 * @param {number} fila - Fila donde se encontró la mina
 * @param {number} columna - Columna donde se encontró la mina
 */
export const registrarDerrota = (fila, columna) => {
    try {
        // Cargar historial existente
        const historial = cargarHistorialDerrotas();
        
        // Buscar si ya existe una entrada para esta posición
        const indice = historial.findIndex(item => item.fila === fila && item.columna === columna);
        
        if (indice >= 0) {
            // Incrementar contador para posición existente
            historial[indice].veces++;
            historial[indice].ultimaVez = new Date().toISOString();
        } else {
            // Añadir nueva entrada
            historial.push({
                fila,
                columna,
                veces: 1,
                ultimaVez: new Date().toISOString()
            });
        }
        
        // Limitar el tamaño del historial para evitar sobrecarga
        const historialLimitado = historial.sort((a, b) => b.veces - a.veces).slice(0, 50);
        
        // Guardar historial actualizado
        localStorage.setItem(STORAGE_KEY, JSON.stringify(historialLimitado));
        
        return historialLimitado;
    } catch (error) {
        console.error("Error al registrar derrota:", error);
        return [];
    }
};

/**
 * Ajustar probabilidades basadas en el historial de derrotas
 * @param {Array} celdasCandidatas - Array de objetos {fila, columna, probabilidad}
 * @param {number} filas - Número de filas del tablero
 * @param {number} columnas - Número de columnas del tablero
 * @returns {Array} - Array con probabilidades ajustadas
 */
export const ajustarProbabilidadesConHistorial = (celdasCandidatas, filas, columnas) => {
    const historial = cargarHistorialDerrotas();
    if (!historial || historial.length === 0) return celdasCandidatas;
    
    // Crear una matriz para normalizar coordenadas entre diferentes tamaños de tablero
    const matrizCalor = Array(filas).fill().map(() => Array(columnas).fill(0));
    
    // Llenar la matriz con los datos del historial
    historial.forEach(item => {
        // Solo considerar si las coordenadas están dentro del tablero actual
        if (item.fila < filas && item.columna < columnas) {
            matrizCalor[item.fila][item.columna] = Math.min(0.75, item.veces * 0.15); // Max 75% de penalización
        }
    });
    
    // Ajustar las probabilidades de las celdas candidatas
    return celdasCandidatas.map(celda => {
        const factorHistorial = matrizCalor[celda.fila][celda.columna];
        
        // Si hay historial para esta celda, aumentar su probabilidad
        if (factorHistorial > 0) {
            const probabilidadAjustada = Math.min(0.95, celda.probabilidad + factorHistorial);
            return {
                ...celda,
                probabilidad: probabilidadAjustada,
                razonAjuste: `(Ajustado por historial: +${Math.round(factorHistorial * 100)}%)`
            };
        }
        
        return celda;
    });
};

/**
 * Clasificar celdas por capas para exploración estratégica
 * @param {Array} tablero - Tablero de juego actual
 * @param {Object} tamañoTablero - Objeto con dimensiones del tablero
 * @param {Array} celdasDescubiertas - Celdas ya descubiertas
 * @param {Array} banderas - Banderas colocadas
 * @returns {Object} - Objeto con capas clasificadas
 */
export const clasificarCeldasPorCapas = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    // Implementación por defecto para satisfacer las importaciones
    return {
        capas: {
            borde: [],
            adyacente: [],
            cercana: [],
            lejana: []
        }
    };
};

/**
 * Selecciona la mejor celda basada en estrategia de capas
 * @param {Object} capas - Capas de celdas clasificadas
 * @param {Object} mapaProbabilidades - Mapa de probabilidades de cada celda
 * @param {Array} historialMovimientos - Historial de movimientos
 * @returns {Object|null} - Celda seleccionada o null si no hay candidatas
 */
export const seleccionarCeldaPorEstrategiaDeCapa = (capas, mapaProbabilidades, historialMovimientos) => {
    // Implementación por defecto para satisfacer las importaciones
    return null;
};

/**
 * Evita patrones predecibles en la selección de celdas
 * @param {Array} celdasCandidatas - Celdas candidatas ordenadas por probabilidad
 * @param {Array} historialMovimientos - Historial de movimientos realizados
 * @returns {Object} - Celda seleccionada con cierta aleatoriedad
 */
export const evitarPatronesPredecibles = (celdasCandidatas, historialMovimientos) => {
    if (!celdasCandidatas || celdasCandidatas.length === 0) return null;
    
    // Añadir algo de aleatoriedad para evitar patrones predecibles
    const indiceAleatorio = Math.floor(Math.random() * Math.min(3, celdasCandidatas.length));
    return celdasCandidatas[indiceAleatorio];
};

/**
 * Procesa la respuesta distinguiendo entre vacío y cero
 * @param {string} tipo - Tipo de respuesta
 * @returns {string} - Respuesta procesada
 */
export const procesarRespuestaConDistincion = (tipo) => {
    // Implementación por defecto para satisfacer las importaciones
    return tipo;
};