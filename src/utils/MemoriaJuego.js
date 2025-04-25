/**
 * Sistema de memoria para el Buscaminas Inverso
 * Esta utilidad permite al sistema "recordar" juegos anteriores
 * y tomar decisiones más inteligentes basadas en experiencias pasadas
 */

// Almacenamiento local para la memoria del juego
const STORAGE_KEY = 'buscaminas_memoria';

/**
 * Función para inicializar la memoria del juego
 * @returns {Object} Objeto de memoria inicializado
 */
export const inicializarMemoria = () => {
    // Intentar cargar la memoria existente
    try {
        const memoriaGuardada = localStorage.getItem(STORAGE_KEY);
        if (memoriaGuardada) {
            return JSON.parse(memoriaGuardada);
        }
    } catch (error) {
        console.error("Error al cargar memoria del juego:", error);
    }

    // Si no hay memoria guardada o hay error, crear estructura inicial
    const memoriaInicial = {
        // Registro de partidas jugadas
        partidas: [],
        
        // Mapa de calor de minas encontradas (para evitar en el futuro)
        mapaCalorMinas: {},
        
        // Registro de patrones de juego
        patrones: {
            movimientosIniciales: {},
            segundosMovimientos: {},
            secuenciasPerdedoras: []
        },
        
        // Estadísticas globales
        estadisticas: {
            partidasJugadas: 0,
            victorias: 0,
            derrotas: 0,
            minasTotales: 0,
            movimientosTotales: 0
        },
        
        // Última fecha de juego
        ultimaPartida: new Date().toISOString()
    };
    
    return memoriaInicial;
};

/**
 * Registra una mina encontrada para evitarla en partidas futuras
 * @param {Object} memoria - Objeto de memoria actual
 * @param {number} fila - Fila donde se encontró la mina
 * @param {number} columna - Columna donde se encontró la mina
 * @param {Object} tamañoTablero - Tamaño del tablero para normalizar coordenadas
 */
export const registrarMinaEncontrada = (memoria, fila, columna, tamañoTablero) => {
    if (!memoria) return;
    
    // Normalizar coordenadas según el tamaño del tablero
    // Esto permite aplicar el conocimiento entre tableros de diferentes tamaños
    const posicionNormalizada = normalizarPosicion(fila, columna, tamañoTablero);
    const clave = `${posicionNormalizada.filaNorm},${posicionNormalizada.columnaNorm}`;
    
    // Actualizar mapa de calor
    if (!memoria.mapaCalorMinas[clave]) {
        memoria.mapaCalorMinas[clave] = 1;
    } else {
        memoria.mapaCalorMinas[clave]++;
    }
    
    // Actualizar estadísticas
    memoria.estadisticas.minasTotales++;
    
    // Guardar memoria actualizada
    guardarMemoria(memoria);
};

/**
 * Registra una secuencia de movimientos que llevó a una derrota
 * @param {Object} memoria - Objeto de memoria actual
 * @param {Array} historialMovimientos - Historial de movimientos hasta la derrota
 * @param {Object} tamañoTablero - Tamaño del tablero
 */
export const registrarSecuenciaPerdedora = (memoria, historialMovimientos, tamañoTablero) => {
    if (!memoria || !historialMovimientos || historialMovimientos.length === 0) return;
    
    // Filtrar solo las selecciones (no banderas)
    const selecciones = historialMovimientos.filter(mov => !mov.esAccion);
    if (selecciones.length === 0) return;
    
    // Normalizar cada posición para poder aplicar el conocimiento en distintos tamaños de tablero
    const secuenciaNormalizada = selecciones.map(mov => {
        const posNorm = normalizarPosicion(mov.fila, mov.columna, tamañoTablero);
        return `${posNorm.filaNorm},${posNorm.columnaNorm}`;
    });
    
    // Guardar la secuencia si no existe ya
    const secuenciaString = secuenciaNormalizada.join('|');
    if (!memoria.patrones.secuenciasPerdedoras.includes(secuenciaString)) {
        memoria.patrones.secuenciasPerdedoras.push(secuenciaString);
    }
    
    // Registrar movimiento inicial
    const movInicial = selecciones[0];
    const posInicialNorm = normalizarPosicion(movInicial.fila, movInicial.columna, tamañoTablero);
    const claveInicial = `${posInicialNorm.filaNorm},${posInicialNorm.columnaNorm}`;
    
    if (!memoria.patrones.movimientosIniciales[claveInicial]) {
        memoria.patrones.movimientosIniciales[claveInicial] = { victorias: 0, derrotas: 1 };
    } else {
        memoria.patrones.movimientosIniciales[claveInicial].derrotas++;
    }
    
    // Registrar segundo movimiento si existe
    if (selecciones.length >= 2) {
        const movSegundo = selecciones[1];
        const posSegundaNorm = normalizarPosicion(movSegundo.fila, movSegundo.columna, tamañoTablero);
        const claveSegunda = `${claveInicial}|${posSegundaNorm.filaNorm},${posSegundaNorm.columnaNorm}`;
        
        if (!memoria.patrones.segundosMovimientos[claveSegunda]) {
            memoria.patrones.segundosMovimientos[claveSegunda] = { victorias: 0, derrotas: 1 };
        } else {
            memoria.patrones.segundosMovimientos[claveSegunda].derrotas++;
        }
    }
    
    // Actualizar estadísticas
    memoria.estadisticas.derrotas++;
    memoria.estadisticas.partidasJugadas++;
    memoria.estadisticas.movimientosTotales += selecciones.length;
    
    // Guardar partida completa
    memoria.partidas.push({
        fecha: new Date().toISOString(),
        resultado: 'derrota',
        movimientos: selecciones.map(s => ({ fila: s.fila, columna: s.columna, resultado: s.contenido })),
        tamañoTablero
    });
    
    // Mantener solo las últimas 20 partidas para no sobrecargar la memoria
    if (memoria.partidas.length > 20) {
        memoria.partidas = memoria.partidas.slice(-20);
    }
    
    // Actualizar fecha
    memoria.ultimaPartida = new Date().toISOString();
    
    // Guardar memoria actualizada
    guardarMemoria(memoria);
};

/**
 * Registra una victoria del sistema
 * @param {Object} memoria - Objeto de memoria actual
 * @param {Array} historialMovimientos - Historial de movimientos hasta la victoria
 * @param {Object} tamañoTablero - Tamaño del tablero
 */
export const registrarVictoria = (memoria, historialMovimientos, tamañoTablero) => {
    if (!memoria || !historialMovimientos) return;
    
    // Filtrar solo las selecciones (no banderas)
    const selecciones = historialMovimientos.filter(mov => !mov.esAccion);
    if (selecciones.length === 0) return;
    
    // Registrar movimiento inicial como exitoso
    const movInicial = selecciones[0];
    const posInicialNorm = normalizarPosicion(movInicial.fila, movInicial.columna, tamañoTablero);
    const claveInicial = `${posInicialNorm.filaNorm},${posInicialNorm.columnaNorm}`;
    
    if (!memoria.patrones.movimientosIniciales[claveInicial]) {
        memoria.patrones.movimientosIniciales[claveInicial] = { victorias: 1, derrotas: 0 };
    } else {
        memoria.patrones.movimientosIniciales[claveInicial].victorias++;
    }
    
    // Registrar segundo movimiento si existe
    if (selecciones.length >= 2) {
        const movSegundo = selecciones[1];
        const posSegundaNorm = normalizarPosicion(movSegundo.fila, movSegundo.columna, tamañoTablero);
        const claveSegunda = `${claveInicial}|${posSegundaNorm.filaNorm},${posSegundaNorm.columnaNorm}`;
        
        if (!memoria.patrones.segundosMovimientos[claveSegunda]) {
            memoria.patrones.segundosMovimientos[claveSegunda] = { victorias: 1, derrotas: 0 };
        } else {
            memoria.patrones.segundosMovimientos[claveSegunda].victorias++;
        }
    }
    
    // Actualizar estadísticas
    memoria.estadisticas.victorias++;
    memoria.estadisticas.partidasJugadas++;
    memoria.estadisticas.movimientosTotales += selecciones.length;
    
    // Guardar partida completa
    memoria.partidas.push({
        fecha: new Date().toISOString(),
        resultado: 'victoria',
        movimientos: selecciones.map(s => ({ fila: s.fila, columna: s.columna, resultado: s.contenido })),
        tamañoTablero
    });
    
    // Mantener solo las últimas 20 partidas para no sobrecargar la memoria
    if (memoria.partidas.length > 20) {
        memoria.partidas = memoria.partidas.slice(-20);
    }
    
    // Actualizar fecha
    memoria.ultimaPartida = new Date().toISOString();
    
    // Guardar memoria actualizada
    guardarMemoria(memoria);
};

/**
 * Evalúa una celda basándose en la memoria histórica
 * @param {Object} memoria - Objeto de memoria actual
 * @param {number} fila - Fila de la celda
 * @param {number} columna - Columna de la celda
 * @param {Object} tamañoTablero - Tamaño del tablero
 * @param {Array} historialMovimientos - Historial de movimientos actual
 * @returns {Object} Evaluación de la celda con factor de riesgo
 */
export const evaluarCeldaConMemoria = (memoria, fila, columna, tamañoTablero, historialMovimientos) => {
    if (!memoria) return { factorRiesgo: 0, razonamiento: "Sin memoria disponible" };
    
    // Normalizar posición
    const posNorm = normalizarPosicion(fila, columna, tamañoTablero);
    const clave = `${posNorm.filaNorm},${posNorm.columnaNorm}`;
    
    let factorRiesgo = 0;
    let razonamiento = [];
    
    // Verificar si esta celda ha tenido minas en el pasado
    if (memoria.mapaCalorMinas[clave]) {
        const frecuenciaMina = memoria.mapaCalorMinas[clave];
        // Calcular riesgo basado en frecuencia (más frecuente = más riesgo)
        const riesgoPorFrecuencia = Math.min(0.8, frecuenciaMina * 0.2);
        factorRiesgo += riesgoPorFrecuencia;
        razonamiento.push(`Histórico de minas (${frecuenciaMina} veces)`);
    }
    
    // Verificar si es un movimiento inicial con historial de derrotas
    if (historialMovimientos.length === 0) {
        if (memoria.patrones.movimientosIniciales[clave]) {
            const stats = memoria.patrones.movimientosIniciales[clave];
            const total = stats.victorias + stats.derrotas;
            if (total > 0) {
                const tasaDerrota = stats.derrotas / total;
                factorRiesgo += tasaDerrota * 0.3;
                razonamiento.push(`Inicio con ${Math.round(tasaDerrota*100)}% de derrotas`);
            }
        }
    }
    
    // Verificar si sería un segundo movimiento con historial negativo
    if (historialMovimientos.length === 1 && !historialMovimientos[0].esAccion) {
        const movInicial = historialMovimientos[0];
        const posInicialNorm = normalizarPosicion(movInicial.fila, movInicial.columna, tamañoTablero);
        const claveInicial = `${posInicialNorm.filaNorm},${posInicialNorm.columnaNorm}`;
        const claveSecuencia = `${claveInicial}|${clave}`;
        
        if (memoria.patrones.segundosMovimientos[claveSecuencia]) {
            const stats = memoria.patrones.segundosMovimientos[claveSecuencia];
            const total = stats.victorias + stats.derrotas;
            if (total > 0) {
                const tasaDerrota = stats.derrotas / total;
                factorRiesgo += tasaDerrota * 0.4;
                razonamiento.push(`Secuencia con ${Math.round(tasaDerrota*100)}% de derrotas`);
            }
        }
    }
    
    // Verificar si esta celda forma parte de una secuencia perdedora
    const movimientosAnteriores = historialMovimientos
        .filter(mov => !mov.esAccion)
        .map(mov => {
            const pos = normalizarPosicion(mov.fila, mov.columna, tamañoTablero);
            return `${pos.filaNorm},${pos.columnaNorm}`;
        });
    
    // Crear la posible secuencia resultante
    const posibleSecuencia = [...movimientosAnteriores, clave].join('|');
    
    // Verificar si esta secuencia o una parte de ella ha resultado en derrota antes
    const secuenciasPerdedoras = memoria.patrones.secuenciasPerdedoras.filter(seq => 
        seq.includes(posibleSecuencia) || posibleSecuencia.includes(seq)
    );
    
    if (secuenciasPerdedoras.length > 0) {
        // Aumentar factor de riesgo basado en cuántas secuencias perdedoras coinciden
        const riesgoSecuencia = Math.min(0.75, secuenciasPerdedoras.length * 0.25);
        factorRiesgo += riesgoSecuencia;
        razonamiento.push(`Secuencia similar a ${secuenciasPerdedoras.length} derrotas previas`);
    }
    
    // Factor de aleatoriedad para evitar comportamiento predecible
    // (agregar un poco de ruido para que el sistema no sea totalmente predecible)
    const ruido = Math.random() * 0.1 - 0.05; // +/- 5%
    factorRiesgo = Math.max(0, Math.min(1, factorRiesgo + ruido));
    
    return {
        factorRiesgo,
        razonamiento: razonamiento.length > 0 ? razonamiento : ["Sin datos históricos"],
        confianza: razonamiento.length > 0 ? 'alta' : 'baja'
    };
};

/**
 * Normaliza una posición según el tamaño del tablero
 * Permite aplicar el conocimiento entre tableros de diferentes tamaños
 * @param {number} fila - Fila de la celda
 * @param {number} columna - Columna de la celda
 * @param {Object} tamañoTablero - Tamaño del tablero
 * @returns {Object} Posición normalizada en escala 0-1
 */
export const normalizarPosicion = (fila, columna, tamañoTablero) => {
    // Normalizar a escala 0-1
    const filaNorm = tamañoTablero.filas > 1 ? fila / (tamañoTablero.filas - 1) : 0;
    const columnaNorm = tamañoTablero.columnas > 1 ? columna / (tamañoTablero.columnas - 1) : 0;
    
    // Discretizar a 10 niveles para generalizar entre tableros
    const discretizarValor = (valor) => {
        return Math.floor(valor * 10) / 10;
    };
    
    return {
        filaNorm: discretizarValor(filaNorm),
        columnaNorm: discretizarValor(columnaNorm)
    };
};

/**
 * Guarda la memoria en el almacenamiento local
 * @param {Object} memoria - Objeto de memoria a guardar
 */
export const guardarMemoria = (memoria) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memoria));
    } catch (error) {
        console.error("Error al guardar la memoria del juego:", error);
    }
};

/**
 * Determina el mejor segundo movimiento basado en la memoria
 * @param {Object} memoria - Objeto de memoria actual
 * @param {Object} primerMovimiento - Primer movimiento realizado
 * @param {Object} tamañoTablero - Tamaño del tablero
 * @returns {Object|null} Coordenadas del mejor segundo movimiento o null si no hay datos
 */
export const determinarMejorSegundoMovimiento = (memoria, primerMovimiento, tamañoTablero) => {
    if (!memoria || !primerMovimiento) return null;
    
    // Normalizar la posición del primer movimiento
    const posNorm = normalizarPosicion(primerMovimiento.fila, primerMovimiento.columna, tamañoTablero);
    const clavePrimero = `${posNorm.filaNorm},${posNorm.columnaNorm}`;
    
    // Buscar todos los segundos movimientos que siguen a este primer movimiento
    const segundosMovimientosPosibles = Object.keys(memoria.patrones.segundosMovimientos)
        .filter(clave => clave.startsWith(clavePrimero + '|'))
        .map(clave => {
            const segundaParte = clave.split('|')[1];
            const [filaNorm, columnaNorm] = segundaParte.split(',').map(parseFloat);
            const stats = memoria.patrones.segundosMovimientos[clave];
            const total = stats.victorias + stats.derrotas;
            const tasaExito = total > 0 ? stats.victorias / total : 0;
            
            // Denormalizar las coordenadas al tamaño actual del tablero
            const fila = Math.round(filaNorm * (tamañoTablero.filas - 1));
            const columna = Math.round(columnaNorm * (tamañoTablero.columnas - 1));
            
            return {
                fila,
                columna,
                tasaExito,
                total
            };
        });
    
    // No hay datos para este primer movimiento
    if (segundosMovimientosPosibles.length === 0) return null;
    
    // Ordenar por tasa de éxito y número de datos
    segundosMovimientosPosibles.sort((a, b) => {
        // Si hay una diferencia significativa en tasa de éxito
        if (Math.abs(a.tasaExito - b.tasaExito) > 0.2) {
            return b.tasaExito - a.tasaExito;
        }
        // Si son similares en éxito, priorizar el que tenga más datos
        return b.total - a.total;
    });
    
    // Retornar el mejor candidato (primera posición del array ordenado)
    return {
        fila: segundosMovimientosPosibles[0].fila,
        columna: segundosMovimientosPosibles[0].columna,
        confianza: segundosMovimientosPosibles[0].total > 2 ? 'alta' : 'media',
        tasaExito: segundosMovimientosPosibles[0].tasaExito
    };
};