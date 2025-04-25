/**
 * Detecta patrones específicos para identificar celdas seguras
 * @param {object} modeloTablero - Modelo del tablero
 * @returns {Array} - Celdas seguras identificadas
 */
const detectarPatronesParaSeguras = (modeloTablero) => {
    const { estadoCeldas, tamañoTablero } = modeloTablero;
    const { filas, columnas } = tamañoTablero;
    const celdasSeguras = [];
    
    // Buscar patrones 1-2-1 (horizontal y vertical)
    const direcciones = [
        { dx: 1, dy: 0 }, // horizontal
        { dx: 0, dy: 1 }  // vertical
    ];
    
    // Buscar patrones en cada dirección
    direcciones.forEach(({ dx, dy }) => {
        // Recorrer todo el tablero
        for (let i = 0; i < filas - 2 * dy; i++) {
            for (let j = 0; j < columnas - 2 * dx; j++) {
                // Posiciones de las tres celdas en el patrón
                const pos1 = { fila: i, columna: j };
                const pos2 = { fila: i + dy, columna: j + dx };
                const pos3 = { fila: i + 2*dy, columna: j + 2*dx };
                
                // Verificar si las tres celdas están descubiertas y tienen los valores 1-2-1
                if (estadoCeldas[pos1.fila][pos1.columna].descubierta && 
                    estadoCeldas[pos2.fila][pos2.columna].descubierta && 
                    estadoCeldas[pos3.fila][pos3.columna].descubierta) {
                    
                    const valor1 = estadoCeldas[pos1.fila][pos1.columna].valor;
                    const valor2 = estadoCeldas[pos2.fila][pos2.columna].valor;
                    const valor3 = estadoCeldas[pos3.fila][pos3.columna].valor;
                    
                    // Verificar si es un patrón 1-2-1
                    if (valor1 === '1' && valor2 === '2' && valor3 === '1') {
                        // Buscar las celdas adyacentes a los 1 que no son adyacentes al 2
                        const adyacentesA2 = obtenerCeldasAdyacentes(pos2.fila, pos2.columna, tamañoTablero);
                        const adyacentesA1 = obtenerCeldasAdyacentes(pos1.fila, pos1.columna, tamañoTablero);
                        const adyacentesA3 = obtenerCeldasAdyacentes(pos3.fila, pos3.columna, tamañoTablero);
                        
                        // Celdas adyacentes a los 1 pero no al 2 son seguras
                        const/**
 * Versión mejorada del módulo de lógica para el juego de Buscaminas Inverso
 * Incluye sistema de aprendizaje, exploración por capas y distinción entre vacío/cero
 */

import { ajustarProbabilidadesConHistorial, cargarHistorialDerrotas, registrarDerrota } from './historialDerrotas';
import { clasificarCeldasPorCapas, seleccionarCeldaPorEstrategiaDeCapa, evitarPatronesPredecibles } from './estrategiaExploracion';
import { procesarRespuestaConDistincion } from './distincionVacioCero';

/**
 * Obtener todas las celdas adyacentes a una celda
 * @param {number} fila - Fila de la celda
 * @param {number} columna - Columna de la celda
 * @param {object} tamañoTablero - Objeto con filas y columnas del tablero
 * @returns {Array} - Array de objetos {fila, columna} de las celdas adyacentes
 */
export const obtenerCeldasAdyacentes = (fila, columna, tamañoTablero) => {
    // Validar que tamañoTablero sea un objeto válido
    if (!tamañoTablero || typeof tamañoTablero !== 'object' || !tamañoTablero.filas || !tamañoTablero.columnas) {
        console.error("Error: tamañoTablero no es válido", tamañoTablero);
        return []; // Retornar array vacío en lugar de fallar
    }
    
    const { filas, columnas } = tamañoTablero;
    const adyacentes = [];

    // Recorrer todas las posiciones adyacentes, incluyendo diagonales
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            // Saltar la celda central (la propia celda)
            if (i === 0 && j === 0) continue;
            
            const nuevaFila = fila + i;
            const nuevaColumna = columna + j;
            
            // Verificar límites del tablero
            if (
                nuevaFila >= 0 && nuevaFila < filas &&
                nuevaColumna >= 0 && nuevaColumna < columnas
            ) {
                adyacentes.push({ fila: nuevaFila, columna: nuevaColumna });
            }
        }
    }
    
    return adyacentes;
/**
 * Encuentra celdas seguras con 100% de certeza
 * @param {object} modeloTablero - Modelo completo del tablero
 * @returns {Array} - Lista de celdas seguras
 */
const identificarCeldasSeguras = (modeloTablero) => {
    const { restricciones, estadoCeldas, tamañoTablero, banderas } = modeloTablero;
    const celdasSeguras = [];
    
    // 1. ANÁLISIS SIMPLE: Si una restricción tiene todas sus minas identificadas,
    // el resto de celdas adyacentes son seguras
    restricciones.forEach(restriccion => {
        const { celda, valor, celdasAfectadas, banderasColocadas } = restriccion;
        
        // Si el número de banderas es igual al valor, todas las demás celdas son seguras
        if (valor === banderasColocadas) {
            // Filtrar celdas sin descubrir y sin bandera
            const celdasSinDescubrirSinBandera = celdasAfectadas.filter(c => 
                !estadoCeldas[c.fila][c.columna].descubierta && 
                !estadoCeldas[c.fila][c.columna].tieneBandera &&
                !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
            );
            
            // Marcar estas celdas como seguras
            celdasSinDescubrirSinBandera.forEach(c => {
                if (!celdasSeguras.some(s => s.fila === c.fila && s.columna === c.columna)) {
                    celdasSeguras.push({
                        fila: c.fila,
                        columna: c.columna,
                        origen: 'análisis simple',
                        celdaOrigen: celda
                    });
                    // Actualizar modelo
                    estadoCeldas[c.fila][c.columna].esSegura = true;
                    estadoCeldas[c.fila][c.columna].probabilidadMina = 0;
                }
            });
        }
    });
    
    // 2. ANÁLISIS DE SUBCONJUNTOS
    // Buscar casos donde podemos deducir celdas seguras por diferencia de conjuntos
    const celdasSegurasSubconjuntos = analizarSubconjuntosParaSeguras(modeloTablero);
    celdasSegurasSubconjuntos.forEach(segura => {
        if (!celdasSeguras.some(s => s.fila === segura.fila && s.columna === segura.columna)) {
            celdasSeguras.push(segura);
            // Actualizar modelo
            estadoCeldas[segura.fila][segura.columna].esSegura = true;
            estadoCeldas[segura.fila][segura.columna].probabilidadMina = 0;
        }
    });
    
    // 3. ANÁLISIS DE PATRONES ESPECÍFICOS
    // Buscar patrones como 1-2-1, etc. que revelen celdas seguras
    const celdasSegurasPatrones = detectarPatronesParaSeguras(modeloTablero);
    celdasSegurasPatrones.forEach(segura => {
        if (!celdasSeguras.some(s => s.fila === segura.fila && s.columna === segura.columna)) {
            celdasSeguras.push(segura);
            // Actualizar modelo
            estadoCeldas[segura.fila][segura.columna].esSegura = true;
            estadoCeldas[segura.fila][segura.columna].probabilidadMina = 0;
        }
    });
    
    return celdasSeguras;
/**
 * Calcula probabilidades de mina para todas las celdas sin descubrir
 * @param {object} modeloTablero - Modelo completo del tablero
 * @returns {object} - Mapa de probabilidades para cada celda
 */
const calcularProbabilidadesGlobales = (modeloTablero) => {
    const { estadoCeldas, restricciones, tamañoTablero } = modeloTablero;
    const { filas, columnas } = tamañoTablero;
    const mapaProbabilidades = {/**
 * Reduce probabilidades para celdas aisladas (lejos de números)
 * @param {object} modeloTablero - Modelo del tablero
 * @param {object} mapaProbabilidades - Mapa de probabilidades a actualizar
 */
const reducirProbabilidadesCeldasAisladas = (modeloTablero, mapaProbabilidades) => {
    const { estadoCeldas, tamañoTablero } = modeloTablero;
    const { filas, columnas } = tamañoTablero;
    
    // Identificar celdas que no están afectadas por ninguna restricción
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            const clave = `${i},${j}`;
            
            // Solo procesar celdas sin descubrir y sin bandera
            if (estadoCeldas[i][j].descubierta || estadoCeldas[i][j].tieneBandera) {
                continue;
            }
            
            // Si la celda no tiene restricciones, reducir probabilidad
            if (estadoCeldas[i][j].restricciones.length === 0) {
                // Reducir probabilidad para celdas aisladas
                if (mapaProbabilidades[clave] && mapaProbabilidades[clave].probabilidad === 0.15) {
                    mapaProbabilidades[clave].probabilidad = 0.05;
                    mapaProbabilidades[clave].origen = 'celda aislada';
                }
            }
            
            // Calcular distancia al número más cercano
            // Cuanto más lejos estén, menor probabilidad
            let distanciaMinima = Number.MAX_SAFE_INTEGER;
            
            for (let fi = 0; fi < filas; fi++) {
                for (let cj = 0; cj < columnas; cj++) {
                    // Solo considerar celdas descubiertas con números
                    if (estadoCeldas[fi][cj].descubierta && 
                        estadoCeldas[fi][cj].valor !== null && 
                        estadoCeldas[fi][cj].valor !== '' && 
                        estadoCeldas[fi][cj].valor !== 'M' &&
                        !isNaN(estadoCeldas[fi][cj].valor)) {
                        
                        // Calcular distancia Manhattan
                        const distancia = Math.abs(fi - i) + Math.abs(cj - j);
                        distanciaMinima = Math.min(distanciaMinima, distancia);
                    }
                }
            }
            
            // Si está muy lejos de cualquier número, es muy poco probable que tenga mina
            if (distanciaMinima > 3 && mapaProbabilidades[clave] && mapaProbabilidades[clave].probabilidad === 0.15) {
                mapaProbabilidades[clave].probabilidad = 0.02;
                mapaProbabilidades[clave].origen = 'celda muy alejada';
            }
        }
    }
/**
 * Analiza subconjuntos para identificar celdas seguras
 * @param {object} modeloTablero - Modelo del tablero
 * @returns {Array} - Celdas seguras identificadas
 */
const analizarSubconjuntosParaSeguras = (modeloTablero) => {
    const { restricciones, estadoCeldas } = modeloTablero;
    const celdasSeguras = [];
    
    // Para cada par de restricciones, buscar si una es subconjunto de otra
    for (let i = 0; i < restricciones.length; i++) {
        const r1 = restricciones[i];
        
        for (let j = 0; j < restricciones.length; j++) {
            if (i === j) continue;
            
            const r2 = restricciones[j];
            
            // Verificar si todas las celdas de r1 están contenidas en r2
            const r1EsSubconjuntoDeR2 = esSubconjunto(r1.celdasAfectadas, r2.celdasAfectadas);
            
            if (r1EsSubconjuntoDeR2) {
                // Calcular las celdas que están en r2 pero no en r1
                const celdasDiferencia = r2.celdasAfectadas.filter(c2 => 
                    !r1.celdasAfectadas.some(c1 => c1.fila === c2.fila && c1.columna === c2.columna)
                );
                
                // Calcular el número de minas en la diferencia
                const minasDiferencia = r2.minasFaltantes - r1.minasFaltantes;
                
                // Si no hay minas en la diferencia, todas esas celdas son seguras
                if (minasDiferencia === 0 && celdasDiferencia.length > 0) {
                    celdasDiferencia.forEach(c => {
                        // Verificar que no esté descubierta ni tenga bandera ya
                        if (!estadoCeldas[c.fila][c.columna].descubierta && 
                            !estadoCeldas[c.fila][c.columna].tieneBandera &&
                            !celdasSeguras.some(s => s.fila === c.fila && s.columna === c.columna)) {
                            
                            celdasSeguras.push({
                                fila: c.fila,
                                columna: c.columna,
                                origen: 'análisis de subconjuntos',
                                celdaOrigen1: r1.celda,
                                celdaOrigen2: r2.celda
                            });
                        }
                    });
                }
            }
        }
    }
    
    return celdasSeguras;
/**
 * Detecta patrones específicos como 1-2-1 para identificar banderas
 * @param {object} modeloTablero - Modelo del tablero
 * @param {Array} banderasYaIdentificadas - Banderas ya identificadas para no duplicar
 * @returns {Array} - Nuevas banderas identificadas
 */
const detectarPatronesParaBanderas = (modeloTablero, banderasYaIdentificadas) => {
    const { estadoCeldas, tamañoTablero } = modeloTablero;
    const { filas, columnas } = tamañoTablero;
    const nuevasBanderas = [];
    
    // Buscar patrones 1-2-1 (horizontal y vertical)
    const direcciones = [
        { dx: 1, dy: 0 }, // horizontal
        { dx: 0, dy: 1 }  // vertical
    ];
    
    // Buscar patrones en cada dirección
    direcciones.forEach(({ dx, dy }) => {
        // Recorrer todo el tablero
        for (let i = 0; i < filas - 2 * dy; i++) {
            for (let j = 0; j < columnas - 2 * dx; j++) {
                // Posiciones de las tres celdas en el patrón
                const pos1 = { fila: i, columna: j };
                const pos2 = { fila: i + dy, columna: j + dx };
                const pos3 = { fila: i + 2*dy, columna: j + 2*dx };
                
                // Verificar si las tres celdas están descubiertas y tienen los valores 1-2-1
                if (estadoCeldas[pos1.fila][pos1.columna].descubierta && 
                    estadoCeldas[pos2.fila][pos2.columna].descubierta && 
                    estadoCeldas[pos3.fila][pos3.columna].descubierta) {
                    
                    const valor1 = estadoCeldas[pos1.fila][pos1.columna].valor;
                    const valor2 = estadoCeldas[pos2.fila][pos2.columna].valor;
                    const valor3 = estadoCeldas[pos3.fila][pos3.columna].valor;
                    
                    // Verificar si es un patrón 1-2-1
                    if (valor1 === '1' && valor2 === '2' && valor3 === '1') {
                        // Buscar las celdas adyacentes al 2 que no son adyacentes a los 1
                        const adyacentesA2 = obtenerCeldasAdyacentes(pos2.fila, pos2.columna, tamañoTablero);
                        const adyacentesA1 = obtenerCeldasAdyacentes(pos1.fila, pos1.columna, tamañoTablero);
                        const adyacentesA3 = obtenerCeldasAdyacentes(pos3.fila, pos3.columna, tamañoTablero);
                        
                        // Celdas únicas del 2 (no adyacentes a los 1)
                        const celdasUnicas = adyacentesA2.filter(c2 => 
                            !adyacentesA1.some(c1 => c1.fila === c2.fila && c1.columna === c2.columna) &&
                            !adyacentesA3.some(c3 => c3.fila === c2.fila && c3.columna === c3.columna)
                        );
                        
                        // Si hay exactamente 2 celdas únicas, son minas
                        if (celdasUnicas.length === 2) {
                            celdasUnicas.forEach(c => {
                                // Verificar que no esté descubierta ni tenga bandera ya
                                if (!estadoCeldas[c.fila][c.columna].descubierta && 
                                    !estadoCeldas[c.fila][c.columna].tieneBandera &&
                                    !banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna) &&
                                    !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                                    
                                    nuevasBanderas.push({
                                        fila: c.fila,
                                        columna: c.columna,
                                        origen: 'patrón 1-2-1',
                                        patron: {
                                            celda1: pos1,
                                            celda2: pos2,
                                            celda3: pos3
                                        }
                                    });
                                }
                            });
                        }
                    }
                }
            }
        }
    });
    
    return nuevasBanderas;
};

/**
 * Verifica si un conjunto de celdas es subconjunto de otro
 * @param {Array} conjunto1 - Primer conjunto de celdas
 * @param {Array} conjunto2 - Segundo conjunto de celdas
 * @returns {boolean} - true si conjunto1 es subconjunto de conjunto2
 */
const esSubconjunto = (conjunto1, conjunto2) => {
    if (conjunto1.length > conjunto2.length) {
        return false;
    }
    
    // Verificar si cada elemento de conjunto1 está en conjunto2
    return conjunto1.every(c1 => 
        conjunto2.some(c2 => c1.fila === c2.fila && c1.columna === c2.columna)
    );
};
    
    // 1. Inicializar mapa con probabilidad base para todas las celdas no descubiertas
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            // Clave única para cada celda
            const clave = `${i},${j}`;
            
            // Si la celda ya está descubierta o tiene bandera, no necesitamos calcular probabilidad
            if (estadoCeldas[i][j].descubierta || estadoCeldas[i][j].tieneBandera) {
                continue;
            }
            
            // Probabilidad base conservadora
            mapaProbabilidades[clave] = {
                probabilidad: 0.15, // Valor conservador por defecto
                certeza: false,
                origen: 'valor base'
            };
        }
    }
    
    // 2. Actualizar probabilidades según restricciones locales
    restricciones.forEach(restriccion => {
        const { celdasAfectadas, minasFaltantes } = restriccion;
        
        // Solo calcular si hay celdas afectadas y minas faltantes
        if (celdasAfectadas.length > 0 && minasFaltantes > 0) {
            // Filtrar celdas sin descubrir y sin bandera
            const celdasRelevantes = celdasAfectadas.filter(c => 
                !estadoCeldas[c.fila][c.columna].descubierta && 
                !estadoCeldas[c.fila][c.columna].tieneBandera
            );
            
            // Si no hay celdas relevantes, saltamos
            if (celdasRelevantes.length === 0) return;
            
            // Calcular probabilidad para esta restricción
            const probabilidadRestricccion = minasFaltantes / celdasRelevantes.length;
            
            // Actualizar mapa de probabilidades
            celdasRelevantes.forEach(c => {
                const clave = `${c.fila},${c.columna}`;
                
                // Si la celda ya tiene una probabilidad asignada, tomamos la más alta
                // (enfoque conservador = más peligroso)
                if (!mapaProbabilidades[clave] || mapaProbabilidades[clave].probabilidad < probabilidadRestricccion) {
                    mapaProbabilidades[clave] = {
                        probabilidad: probabilidadRestricccion,
                        certeza: false,
                        origen: `restricción de celda (${restriccion.celda.fila+1},${restriccion.celda.columna+1})`
                    };
                }
            });
        }
    });
    
    // 3. Reducir probabilidades para celdas aisladas (lejos de números)
    reducirProbabilidadesCeldasAisladas(modeloTablero, mapaProbabilidades);
    
    // 4. Ajustar probabilidades según patrones globales
    ajustarProbabilidadesSegunPatrones(modeloTablero, mapaProbabilidades);
    
    return mapaProbabilidades;
};

/**
 * Historial de selecciones para evitar repetir celdas en aleatorios
 * @type {Array<string>}
 */
let historialSeleccionesAleatorias = [];

/**
 * Seleccionar una celda aleatoria para el primer movimiento, evitando repeticiones
 * @param {object} tamañoTablero - Objeto con filas y columnas del tablero
 * @returns {object} - Celda seleccionada {fila, columna}
 */
export const seleccionarPrimeraCeldaSegura = (tamañoTablero) => {
    // Validar que tamañoTablero sea un objeto válido
    if (!tamañoTablero || typeof tamañoTablero !== 'object' || !tamañoTablero.filas || !tamañoTablero.columnas) {
        console.error("Error: tamañoTablero no es válido", tamañoTablero);
        return { fila: 0, columna: 0 }; // Valor por defecto en caso de error
    }
    
    const { filas, columnas } = tamañoTablero;
    
    // Estrategia mejorada: 
    // 1. Preferir esquinas y bordes en primeras jugadas (menor número de celdas adyacentes)
    // 2. Evitar repetir celdas ya seleccionadas recientemente
    // 3. Considerar historial de derrotas para evitar celdas problemáticas
    
    // Reiniciar historial si se cambia el tamaño del tablero
    if (historialSeleccionesAleatorias.length > 0) {
        const primeraSeleccion = historialSeleccionesAleatorias[0].split(',');
        const filaHistorial = parseInt(primeraSeleccion[0]);
        
        // Si la fila está fuera del rango del nuevo tablero, reiniciar historial
        if (filaHistorial >= filas) {
            historialSeleccionesAleatorias = [];
        }
    }
    
    // Limitar el historial para no almacenar demasiadas entradas
    if (historialSeleccionesAleatorias.length > 10) {
        historialSeleccionesAleatorias = historialSeleccionesAleatorias.slice(-10);
    }
    
    // Lista de posibles ubicaciones, priorizando esquinas y bordes
    const ubicacionesPrioritarias = [];
    const ubicacionesNormales = [];
    
    // Cargar historial de derrotas
    const historialDerrotas = cargarHistorialDerrotas();
    
    // Clasificar ubicaciones entre prioritarias (bordes/esquinas) y normales
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            // Crear clave para la celda
            const clave = `${i},${j}`;
            
            // Si ya está en el historial, saltarla
            if (historialSeleccionesAleatorias.includes(clave)) {
                continue;
            }
            
            // Verificar si la celda está en el historial de derrotas
            const estaEnHistorialDerrotas = historialDerrotas.some(
                d => d.fila === i && d.columna === j
            );
            
            // Si está en el historial de derrotas, saltar esta celda para el primer movimiento
            if (estaEnHistorialDerrotas) {
                continue;
            }
            
            // Es esquina
            const esEsquina = (i === 0 || i === filas - 1) && (j === 0 || j === columnas - 1);
            // Es borde
            const esBorde = i === 0 || i === filas - 1 || j === 0 || j === columnas - 1;
            
            if (esEsquina) {
                ubicacionesPrioritarias.unshift({ fila: i, columna: j }); // Añadir al principio (mayor prioridad)
            } else if (esBorde) {
                ubicacionesPrioritarias.push({ fila: i, columna: j }); // Añadir al final
            } else {
                ubicacionesNormales.push({ fila: i, columna: j });
            }
        }
    }
    
    // Si no hay ubicaciones prioritarias, usar ubicaciones normales
    let todasLasUbicaciones = [...ubicacionesPrioritarias];
    
    // Solo añadir ubicaciones normales si no hay suficientes prioritarias
    if (todasLasUbicaciones.length < 3) {
        todasLasUbicaciones = [...todasLasUbicaciones, ...ubicacionesNormales];
    }
    
    // Si no hay ubicaciones disponibles (raro), reiniciar historial y volver a intentar
    if (todasLasUbicaciones.length === 0) {
        historialSeleccionesAleatorias = [];
        return seleccionarPrimeraCeldaSegura(tamañoTablero);
    }
    
    // Seleccionar una posición con algo de aleatoriedad
    // Más probable elegir al principio, pero no garantizado
    const factorAleatorio = Math.random();
    // Índice más probable cerca del inicio pero con algo de variabilidad
    const indice = Math.min(
        Math.floor(factorAleatorio * factorAleatorio * todasLasUbicaciones.length),
        todasLasUbicaciones.length - 1
    );
    
    const seleccion = todasLasUbicaciones[indice];
    
    // Añadir al historial
    historialSeleccionesAleatorias.push(`${seleccion.fila},${seleccion.columna}`);
    
    return seleccion;
};

/**
 * Crear un modelo completo del tablero con toda la información disponible
 * @param {Array} tablero - Estado actual del tablero
 * @param {object} tamañoTablero - Dimensiones del tablero
 * @param {Array} celdasDescubiertas - Celdas ya descubiertas
 * @param {Array} banderas - Banderas colocadas
 * @returns {object} - Modelo completo del tablero
 */
const crearModeloTablero = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    const { filas, columnas } = tamañoTablero;
    
    // Crear matriz de estado para todas las celdas
    const estadoCeldas = Array(filas).fill().map(() => 
        Array(columnas).fill().map(() => ({
            descubierta: false,
            valor: null,
            tieneBandera: false,
            esSegura: false,
            probabilidadMina: 0.5,  // Valor inicial neutral
            restricciones: []       // Qué celdas numéricas afectan a esta celda
        }))
    );
    
    // Actualizar con celdas descubiertas
    celdasDescubiertas.forEach(celda => {
        const { fila, columna } = celda;
        if (fila >= 0 && fila < filas && columna >= 0 && columna < columnas) {
            estadoCeldas[fila][columna].descubierta = true;
            estadoCeldas[fila][columna].valor = tablero[fila][columna];
            estadoCeldas[fila][columna].probabilidadMina = 0; // Celda descubierta, probabilidad 0
        }
    });
    
    // Actualizar con banderas
    banderas.forEach(bandera => {
        const { fila, columna } = bandera;
        if (fila >= 0 && fila < filas && columna >= 0 && columna < columnas) {
            estadoCeldas[fila][columna].tieneBandera = true;
            estadoCeldas[fila][columna].probabilidadMina = 1; // Bandera = 100% mina
        }
    });
    
    // Procesar restricciones de celdas numéricas
    const restricciones = [];
    
    celdasDescubiertas.forEach(celda => {
        const { fila, columna } = celda;
        const valor = tablero[fila][columna];
        
        // Solo procesar celdas con números
        if (valor !== null && valor !== undefined && !isNaN(valor) && valor !== '' && valor !== 'M') {
            const numeroMinas = parseInt(valor);
            
            // Obtener celdas adyacentes
            const adyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
            
            // Filtrar celdas relevantes (no descubiertas o con bandera)
            const celdasRelevantes = adyacentes.filter(adj => 
                !celdasDescubiertas.some(desc => 
                    desc.fila === adj.fila && desc.columna === adj.columna
                ) || banderas.some(band => 
                    band.fila === adj.fila && band.columna === adj.columna
                )
            );
            
            // Contar banderas ya colocadas
            const banderasColocadas = celdasRelevantes.filter(adj => 
                banderas.some(band => band.fila === adj.fila && band.columna === adj.columna)
            ).length;
            
            // Añadir restricción
            const restriccion = {
                celda: { fila, columna },
                valor: numeroMinas,
                celdasAfectadas: celdasRelevantes.map(c => ({ fila: c.fila, columna: c.columna })),
                banderasColocadas,
                minasFaltantes: numeroMinas - banderasColocadas
            };
            
            restricciones.push(restriccion);
            
            // Actualizar celdas afectadas por esta restricción
            celdasRelevantes.forEach(adj => {
                if (adj.fila >= 0 && adj.fila < filas && adj.columna >= 0 && adj.columna < columnas) {
                    estadoCeldas[adj.fila][adj.columna].restricciones.push({
                        origen: { fila, columna },
                        valor: numeroMinas,
                        banderasColocadas,
                        minasFaltantes: numeroMinas - banderasColocadas
                    });
                }
            });
        }
    });
    
    return {
        estadoCeldas,
        restricciones,
        tamañoTablero,
        celdasDescubiertas: celdasDescubiertas.map(c => ({ ...c })),
        banderas: banderas.map(b => ({ ...b }))
    };
};

/**
 * Analizar el tablero para tomar decisiones estratégicas (versión mejorada)
 * @param {object} parametros - Parámetros del análisis
 * @returns {object} - Decisiones del análisis
 */
export const analizarTablero = ({
    tablero,
    tamañoTablero,
    celdasDescubiertas,
    banderas,
    historialMovimientos,
    setMensajeSistema,
    setAnimacion
}) => {
    // Verificar todos los parámetros para evitar errores
    if (!tablero || !Array.isArray(tablero) || tablero.length === 0) {
        console.error("Error: tablero no es válido", tablero);
        return { banderas: banderas || [], siguienteCelda: null, movimientosGenerados: [] };
    }
    
    if (!tamañoTablero || typeof tamañoTablero !== 'object' || !tamañoTablero.filas || !tamañoTablero.columnas) {
        console.error("Error: tamañoTablero no es válido", tamañoTablero);
        return { banderas: banderas || [], siguienteCelda: null, movimientosGenerados: [] };
    }
    
    if (!celdasDescubiertas || !Array.isArray(celdasDescubiertas)) {
        console.error("Error: celdasDescubiertas no es válido", celdasDescubiertas);
        return { banderas: banderas || [], siguienteCelda: null, movimientosGenerados: [] };
    }
    
    if (!banderas || !Array.isArray(banderas)) {
        console.error("Error: banderas no es válido", banderas);
        return { banderas: [], siguienteCelda: null, movimientosGenerados: [] };
    }
    
    try {
        // 1. CREAR MODELO COMPLETO DEL TABLERO
        const modeloTablero = crearModeloTablero(tablero, tamañoTablero, celdasDescubiertas, banderas);
        
        // 2. IDENTIFICAR TODAS LAS BANDERAS NUEVAS
        const nuevasBanderas = identificarTodasLasBanderas(modeloTablero);
        
        // 3. IDENTIFICAR CELDAS 100% SEGURAS
        const celdasSeguras = identificarCeldasSeguras(modeloTablero);
        
        // 4. CALCULAR PROBABILIDADES PARA TODAS LAS CELDAS
        const mapaProbabilidades = calcularProbabilidadesGlobales(modeloTablero);
        
        // 5. CLASIFICAR CELDAS POR CAPAS PARA EXPLORACIÓN SISTEMÁTICA
        const { capas } = clasificarCeldasPorCapas(tablero, tamañoTablero, celdasDescubiertas, banderas);
        
        // 6. AJUSTAR PROBABILIDADES SEGÚN HISTORIAL DE DERROTAS
        const celdasCandidatas = [];
        
        // Convertir el mapa de probabilidades a un array para procesamiento
        Object.entries(mapaProbabilidades).forEach(([clave, info]) => {
            const [fila, columna] = clave.split(',').map(Number);
            celdasCandidatas.push({
                fila,
                columna,
                probabilidad: info.probabilidad,
                origen: info.origen
            });
        });
        
        // Ajustar probabilidades con historial de derrotas
        const celdasConHistorialAjustado = ajustarProbabilidadesConHistorial(
            celdasCandidatas, 
            tamañoTablero.filas, 
            tamañoTablero.columnas
        );
        
        // 7. DETERMINAR LA MEJOR JUGADA
        let siguienteCelda;
        
        // Si hay celdas 100% seguras, usar una de ellas
        if (celdasSeguras.length > 0) {
            const indiceAleatorio = Math.floor(Math.random() * celdasSeguras.length);
            siguienteCelda = {
                fila: celdasSeguras[indiceAleatorio].fila,
                columna: celdasSeguras[indiceAleatorio].columna,
                tipoAnalisis: 'celda 100% segura',
                origen: celdasSeguras[indiceAleatorio].origen
            };
        } 
        // Si no hay celdas seguras, usar estrategia de capas
        else {
            // Ordenar celdas ajustadas por probabilidad (menor primero)
            celdasConHistorialAjustado.sort((a, b) => a.probabilidad - b.probabilidad);
            
            // Buscar la mejor celda usando estrategia de capas
            const celdaEstrategiaCapa = seleccionarCeldaPorEstrategiaDeCapa(
                capas, 
                mapaProbabilidades, 
                historialMovimientos
            );
            
            // Evitar patrones predecibles (como siempre ir a 1,1 después de 0,0)
            if (celdaEstrategiaCapa) {
                siguienteCelda = evitarPatronesPredecibles(
                    [celdaEstrategiaCapa, ...celdasConHistorialAjustado.slice(0, 3)],
                    historialMovimientos
                );
            } else if (celdasConHistorialAjustado.length > 0) {
                siguienteCelda = evitarPatronesPredecibles(
                    celdasConHistorialAjustado.slice(0, 4), // Tomar las 4 mejores opciones
                    historialMovimientos
                );
            } else {
                // Si no hay celdas disponibles (raro), seleccionar aleatorio
                siguienteCelda = seleccionarCeldaAleatoria(
                    tablero, tamañoTablero, celdasDescubiertas, banderas
                );
            }
        }
        
        // 8. GENERAR MOVIMIENTOS PARA NUEVAS BANDERAS
        const movimientosGenerados = nuevasBanderas.map(bandera => ({
            fila: bandera.fila,
            columna: bandera.columna,
            esAccion: true,
            accion: "bandera",
            origen: bandera.origen
        }));
        
        // 9. ACTUALIZAR MENSAJES DEL SISTEMA
        // Si hay banderas nuevas, actualizar mensaje
        if (nuevasBanderas.length > 0 && setMensajeSistema) {
            setMensajeSistema(`He identificado ${nuevasBanderas.length} mina${nuevasBanderas.length > 1 ? 's' : ''} con certeza y las he marcado con banderas.`);
            if (setAnimacion) setAnimacion('bandera');
        }
        
        // Si hay siguiente celda, actualizar mensaje
        if (siguienteCelda && setMensajeSistema && !nuevasBanderas.length) {
            const tipoAnalisis = siguienteCelda.tipoAnalisis || '';
            const estrategia = siguienteCelda.estrategia || '';
            let mensaje = `Seleccionando la casilla (${siguienteCelda.fila + 1},${siguienteCelda.columna + 1})`;
            
            if (tipoAnalisis) {
                mensaje += ` - ${tipoAnalisis}`;
            }
            
            if (estrategia) {
                mensaje += ` - Estrategia: ${estrategia}`;
            }
            
            if (siguienteCelda.razon) {
                mensaje += ` (${siguienteCelda.razon})`;
            }
            
            if (siguienteCelda.razonAjuste) {
                mensaje += ` ${siguienteCelda.razonAjuste}`;
            }
            
            setMensajeSistema(mensaje);
        }
        
        return {
            banderas: [...banderas, ...nuevasBanderas],
            siguienteCelda,
            movimientosGenerados,
            mapaProbabilidades
        };
    } catch (error) {
        console.error("Error al analizar tablero:", error);
        // En caso de error, seleccionar una celda aleatoria para no bloquear el juego
        return {
            banderas: banderas || [],
            siguienteCelda: seleccionarCeldaAleatoria(tablero, tamañoTablero, celdasDescubiertas, banderas),
            movimientosGenerados: []
        };
    }
};

/**
 * Seleccionar una celda aleatoria entre las disponibles, evitando repeticiones
 * @param {Array} tablero - Estado actual del tablero
 * @param {object} tamañoTablero - Dimensiones del tablero
 * @param {Array} celdasDescubiertas - Celdas ya descubiertas
 * @param {Array} banderas - Banderas colocadas
 * @returns {object} - Celda seleccionada aleatoriamente
 */
const seleccionarCeldaAleatoria = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    // Validar parámetros
    if (!tablero || !Array.isArray(tablero) || tablero.length === 0 || 
        !tamañoTablero || !tamañoTablero.filas || !tamañoTablero.columnas) {
        console.error("Error al seleccionar celda aleatoria: parámetros inválidos");
        // Retornar un valor por defecto seguro
        return { fila: 0, columna: 0 };
    }
    
    // Cargar historial de derrotas para evitar celdas problemáticas
    const historialDerrotas = cargarHistorialDerrotas();
    
    // Lista de celdas disponibles (no descubiertas y sin bandera)
    const celdasDisponibles = [];
    const celdasProbablementePeligrosas = [];
    
    // Recorrer el tablero
    for (let i = 0; i < tamañoTablero.filas; i++) {
        for (let j = 0; j < tamañoTablero.columnas; j++) {
            // Validar que los arrays existen
            if (!celdasDescubiertas || !banderas) {
                celdasDisponibles.push({ fila: i, columna: j });
                continue;
            }
            
            // Verificar si la celda ya ha sido descubierta
            const estaDescubierta = celdasDescubiertas.some(c => c.fila === i && c.columna === j);
            
            // Verificar si la celda tiene bandera
            const tieneBandera = banderas.some(b => b.fila === i && b.columna === j);
            
            // Verificar si está en el historial de derrotas
            const estaEnHistorialDerrotas = historialDerrotas.some(d => d.fila === i && d.columna === j);
            
            // Si no está descubierta y no tiene bandera, está disponible
            if (!estaDescubierta && !tieneBandera) {
                if (estaEnHistorialDerrotas) {
                    celdasProbablementePeligrosas.push({ 
                        fila: i, 
                        columna: j,
                        vecesPerdidas: historialDerrotas.find(d => d.fila === i && d.columna === j)?.veces || 1
                    });
                } else {
                    celdasDisponibles.push({ fila: i, columna: j });
                }
            }
        }
    }
    
    // Decidir si usar celdas seguras o arriesgar con celdas peligrosas
    // Si no hay celdas "seguras" disponibles, usar las peligrosas
    let poolSeleccion = celdasDisponibles;
    
    if (celdasDisponibles.length === 0 && celdasProbablementePeligrosas.length > 0) {
        // Ordenar por menos veces perdidas
        poolSeleccion = celdasProbablementePeligrosas.sort((a, b) => a.vecesPerdidas - b.vecesPerdidas);
    }
    
    // Si hay celdas disponibles, seleccionar una aleatoriamente
    if (poolSeleccion.length > 0) {
        // Evitar seleccionar celdas en el historial reciente
        // Para este caso simple, simplemente usamos un índice aleatorio variable
        const indiceAleatorio = Math.floor(Math.random() * poolSeleccion.length);
        
        const seleccion = poolSeleccion[indiceAleatorio];
        seleccion.tipoAnalisis = 'selección aleatoria';
        return seleccion;
    }
    
    // Si no hay celdas disponibles (raro), retornar null
    return null;
};

/**
 * Registrar una derrota y aprender de ella
 * @param {object} celda - Celda donde se encontró una mina {fila, columna}
 */
export const aprenderDeDerrota = (celda) => {
    if (!celda || celda.fila === undefined || celda.columna === undefined) {
        return;
    }
    
    // Registrar en el historial de derrotas
    registrarDerrota(celda.fila, celda.columna);
};

/**
 * Identifica todas las banderas que se pueden colocar con certeza
 * @param {object} modeloTablero - Modelo completo del tablero
 * @returns {Array} - Lista de nuevas banderas a colocar
 */
const identificarTodasLasBanderas = (modeloTablero) => {
    const { restricciones, estadoCeldas, banderas } = modeloTablero;
    const nuevasBanderas = [];
    
    // 1. ANÁLISIS SIMPLE: Si una restricción tiene exactamente tantas celdas sin descubrir
    // como minas faltantes, todas esas celdas son minas
    restricciones.forEach(restriccion => {
        const { celda, valor, celdasAfectadas, banderasColocadas } = restriccion;
        const minasFaltantes = valor - banderasColocadas;
        
        // Filtrar celdas sin descubrir y sin bandera
        const celdasSinDescubrirSinBandera = celdasAfectadas.filter(c => 
            !estadoCeldas[c.fila][c.columna].descubierta && 
            !estadoCeldas[c.fila][c.columna].tieneBandera &&
            !banderas.some(b => b.fila === c.fila && b.columna === c.columna) &&
            !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)
        );
        
        // Si el número de celdas sin descubrir es igual a las minas faltantes,
        // todas son minas (y podemos colocar banderas)
        if (celdasSinDescubrirSinBandera.length === minasFaltantes && minasFaltantes > 0) {
            celdasSinDescubrirSinBandera.forEach(c => {
                if (!nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                    nuevasBanderas.push({
                        fila: c.fila,
                        columna: c.columna,
                        origen: 'análisis simple',
                        celdaOrigen: celda
                    });
                    // Actualizar modelo
                    estadoCeldas[c.fila][c.columna].tieneBandera = true;
                    estadoCeldas[c.fila][c.columna].probabilidadMina = 1;
                }
            });
        }
    });
    
    // 2. ANÁLISIS DE SUBCONJUNTOS
    // Buscar casos donde una restricción es subconjunto de otra
    const nuevasBanderasSubconjuntos = analizarSubconjuntos(modeloTablero, nuevasBanderas);
    nuevasBanderasSubconjuntos.forEach(bandera => {
        if (!nuevasBanderas.some(b => b.fila === bandera.fila && b.columna === bandera.columna)) {
            nuevasBanderas.push(bandera);
            // Actualizar modelo
            estadoCeldas[bandera.fila][bandera.columna].tieneBandera = true;
            estadoCeldas[bandera.fila][bandera.columna].probabilidadMina = 1;
        }
    });
    
    // 3. ANÁLISIS DE PATRONES ESPECÍFICOS
    // Buscar patrones como 1-2-1, etc.
    const nuevasBanderasPatrones = detectarPatronesParaBanderas(modeloTablero, nuevasBanderas);
    nuevasBanderasPatrones.forEach(bandera => {
        if (!nuevasBanderas.some(b => b.fila === bandera.fila && b.columna === bandera.columna)) {
            nuevasBanderas.push(bandera);
            // Actualizar modelo
            estadoCeldas[bandera.fila][bandera.columna].tieneBandera = true;
            estadoCeldas[bandera.fila][bandera.columna].probabilidadMina = 1;
        }
    });
    
    return nuevasBanderas;
};
