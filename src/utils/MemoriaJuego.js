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
 * Registra una mina encontrada para evitarla en partidas futuras - Versión mejorada
 * @param {Object} memoria - Objeto de memoria actual
 * @param {number} fila - Fila donde se encontró la mina
 * @param {number} columna - Columna donde se encontró la mina
 * @param {Object} tamañoTablero - Tamaño del tablero para normalizar coordenadas
 */
export const registrarMinaEncontrada = (memoria, fila, columna, tamañoTablero) => {
    if (!memoria) {
        console.warn("Error: Memoria no inicializada en registrarMinaEncontrada");
        return;
    }
    
    try {
        console.log(`Registrando mina encontrada en (${fila}, ${columna})`);
        
        // 1. Registrar en mapa de calor normalizado (para generalizar entre tableros)
        if (memoria.mapaCalorMinas === undefined) {
            memoria.mapaCalorMinas = {};
        }
        
        // Normalizar coordenadas según el tamaño del tablero
        const posicionNormalizada = normalizarPosicion(fila, columna, tamañoTablero);
        
        if (!posicionNormalizada) {
            console.warn("No se pudo normalizar la posición:", fila, columna, tamañoTablero);
            // Continuar con el resto del registro aunque falle la normalización
        } else {
            const clave = `${posicionNormalizada.filaNorm},${posicionNormalizada.columnaNorm}`;
            
            // Actualizar mapa de calor normalizado
            if (!memoria.mapaCalorMinas[clave]) {
                memoria.mapaCalorMinas[clave] = 1;
            } else {
                memoria.mapaCalorMinas[clave]++;
            }
            
            console.log(`Mina registrada con clave normalizada: ${clave} (valor: ${memoria.mapaCalorMinas[clave]})`);
        }
        
        // 2. NUEVO: Registrar también las coordenadas exactas (sin normalizar)
        // Esto permite una comprobación adicional incluso si la normalización falla
        if (!memoria.minasExactas) {
            memoria.minasExactas = {};
        }
        
        const claveExacta = `${fila},${columna}`;
        if (!memoria.minasExactas[claveExacta]) {
            memoria.minasExactas[claveExacta] = {
                fila,
                columna,
                ocurrencias: 1,
                ultimoTablero: {
                    filas: tamañoTablero.filas,
                    columnas: tamañoTablero.columnas
                },
                fechaRegistro: new Date().toISOString()
            };
        } else {
            memoria.minasExactas[claveExacta].ocurrencias++;
            memoria.minasExactas[claveExacta].ultimoTablero = {
                filas: tamañoTablero.filas,
                columnas: tamañoTablero.columnas
            };
        }
        
        console.log(`Mina registrada con coordenadas exactas: ${claveExacta} (ocurrencias: ${memoria.minasExactas[claveExacta].ocurrencias})`);
        
        // 3. Mantener una lista de las últimas N minas encontradas (histórico reciente)
        if (!memoria.ultimasMinasEncontradas) {
            memoria.ultimasMinasEncontradas = [];
        }
        
        // Añadir la mina al historial reciente
        memoria.ultimasMinasEncontradas.push({
            fila,
            columna,
            tablero: {
                filas: tamañoTablero.filas,
                columnas: tamañoTablero.columnas
            },
            fecha: new Date().toISOString()
        });
        
        // Limitar el tamaño del historial reciente
        if (memoria.ultimasMinasEncontradas.length > 50) {
            memoria.ultimasMinasEncontradas = memoria.ultimasMinasEncontradas.slice(-50);
        }
        
        // Actualizar estadísticas
        if (!memoria.estadisticas) {
            memoria.estadisticas = {
                partidasJugadas: 0,
                victorias: 0,
                derrotas: 0,
                minasTotales: 0,
                movimientosTotales: 0
            };
        }
        
        memoria.estadisticas.minasTotales = (memoria.estadisticas.minasTotales || 0) + 1;
        
        // Guardar el tamaño de tablero más reciente para futuras consultas
        memoria.ultimoTablero = {
            filas: tamañoTablero.filas,
            columnas: tamañoTablero.columnas
        };
        
        console.log("Registro de mina completado exitosamente");
        
        // La función guardarMemoria se llama desde fuera después de esta función
    } catch (error) {
        console.error("Error en registrarMinaEncontrada:", error);
    }
};

/**
 * Registra una secuencia de movimientos que llevó a una derrota
 * @param {Object} memoria - Objeto de memoria actual
 * @param {Array} historialMovimientos - Historial de movimientos hasta la derrota
 * @param {Object} tamañoTablero - Tamaño del tablero
 */
export const registrarSecuenciaPerdedora = (memoria, historialMovimientos, tamañoTablero) => {
    if (!memoria || !historialMovimientos || historialMovimientos.length === 0) {
        console.warn("Parámetros inválidos en registrarSecuenciaPerdedora");
        return;
    }

    try {
        // Asegurarse de que los patrones existan
        if (!memoria.patrones) {
            memoria.patrones = {
                movimientosIniciales: {},
                segundosMovimientos: {},
                secuenciasPerdedoras: []
            };
        }

        // Filtrar solo las selecciones (no banderas)
        const selecciones = historialMovimientos.filter(mov => !mov.esAccion);
        if (selecciones.length === 0) return;

        // Normalizar cada posición para poder aplicar el conocimiento en distintos tamaños de tablero
        const secuenciaNormalizada = [];
        for (const mov of selecciones) {
            const posNorm = normalizarPosicion(mov.fila, mov.columna, tamañoTablero);
            if (posNorm) {
                secuenciaNormalizada.push(`${posNorm.filaNorm},${posNorm.columnaNorm}`);
            }
        }

        // Si no hay secuencia normalizada, salir
        if (secuenciaNormalizada.length === 0) return;

        // Guardar la secuencia si no existe ya
        const secuenciaString = secuenciaNormalizada.join('|');
        if (!memoria.patrones.secuenciasPerdedoras.includes(secuenciaString)) {
            memoria.patrones.secuenciasPerdedoras.push(secuenciaString);
        }

        // Registrar movimiento inicial
        const movInicial = selecciones[0];
        const posInicialNorm = normalizarPosicion(movInicial.fila, movInicial.columna, tamañoTablero);

        if (posInicialNorm) {
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

                if (posSegundaNorm) {
                    const claveSegunda = `${claveInicial}|${posSegundaNorm.filaNorm},${posSegundaNorm.columnaNorm}`;

                    if (!memoria.patrones.segundosMovimientos[claveSegunda]) {
                        memoria.patrones.segundosMovimientos[claveSegunda] = { victorias: 0, derrotas: 1 };
                    } else {
                        memoria.patrones.segundosMovimientos[claveSegunda].derrotas++;
                    }
                }
            }
        }

        // Actualizar estadísticas
        if (!memoria.estadisticas) {
            memoria.estadisticas = {
                partidasJugadas: 0,
                victorias: 0,
                derrotas: 0,
                minasTotales: 0,
                movimientosTotales: 0
            };
        }

        memoria.estadisticas.derrotas = (memoria.estadisticas.derrotas || 0) + 1;
        memoria.estadisticas.partidasJugadas = (memoria.estadisticas.partidasJugadas || 0) + 1;
        memoria.estadisticas.movimientosTotales = (memoria.estadisticas.movimientosTotales || 0) + selecciones.length;

        // Guardar partida completa
        if (!memoria.partidas) {
            memoria.partidas = [];
        }

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
    } catch (error) {
        console.error("Error en registrarSecuenciaPerdedora:", error);
    }
};

/**
 * Registra una victoria del sistema
 * @param {Object} memoria - Objeto de memoria actual
 * @param {Array} historialMovimientos - Historial de movimientos hasta la victoria
 * @param {Object} tamañoTablero - Tamaño del tablero
 */
export const registrarVictoria = (memoria, historialMovimientos, tamañoTablero) => {
    if (!memoria || !historialMovimientos) {
        console.warn("Parámetros inválidos en registrarVictoria");
        return;
    }

    try {
        // Filtrar solo las selecciones (no banderas)
        const selecciones = historialMovimientos.filter(mov => !mov.esAccion);
        if (selecciones.length === 0) return;

        // Asegurarse de que los patrones existan
        if (!memoria.patrones) {
            memoria.patrones = {
                movimientosIniciales: {},
                segundosMovimientos: {},
                secuenciasPerdedoras: []
            };
        }

        // Registrar movimiento inicial como exitoso
        const movInicial = selecciones[0];
        const posInicialNorm = normalizarPosicion(movInicial.fila, movInicial.columna, tamañoTablero);

        if (posInicialNorm) {
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

                if (posSegundaNorm) {
                    const claveSegunda = `${claveInicial}|${posSegundaNorm.filaNorm},${posSegundaNorm.columnaNorm}`;

                    if (!memoria.patrones.segundosMovimientos[claveSegunda]) {
                        memoria.patrones.segundosMovimientos[claveSegunda] = { victorias: 1, derrotas: 0 };
                    } else {
                        memoria.patrones.segundosMovimientos[claveSegunda].victorias++;
                    }
                }
            }
        }

        // Actualizar estadísticas
        if (!memoria.estadisticas) {
            memoria.estadisticas = {
                partidasJugadas: 0,
                victorias: 0,
                derrotas: 0,
                minasTotales: 0,
                movimientosTotales: 0
            };
        }

        memoria.estadisticas.victorias = (memoria.estadisticas.victorias || 0) + 1;
        memoria.estadisticas.partidasJugadas = (memoria.estadisticas.partidasJugadas || 0) + 1;
        memoria.estadisticas.movimientosTotales = (memoria.estadisticas.movimientosTotales || 0) + selecciones.length;

        // Guardar partida completa
        if (!memoria.partidas) {
            memoria.partidas = [];
        }

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
    } catch (error) {
        console.error("Error en registrarVictoria:", error);
    }
};

/**
 * Evalúa una celda basándose en la memoria histórica - Versión mejorada
 * @param {Object} memoria - Objeto de memoria actual
 * @param {number} fila - Fila de la celda
 * @param {number} columna - Columna de la celda
 * @param {Object} tamañoTablero - Tamaño del tablero
 * @param {Array} historialMovimientos - Historial de movimientos actual
 * @returns {Object} Evaluación de la celda con factor de riesgo
 */
export const evaluarCeldaConMemoria = (memoria, fila, columna, tamañoTablero, historialMovimientos) => {
    if (!memoria) return { factorRiesgo: 0, razonamiento: ["Sin memoria disponible"] };

    try {
        // Normalizar posición
        const posNorm = normalizarPosicion(fila, columna, tamañoTablero);
        if (!posNorm) {
            return { factorRiesgo: 0, razonamiento: ["Error al normalizar posición"] };
        }

        const clave = `${posNorm.filaNorm},${posNorm.columnaNorm}`;

        let factorRiesgo = 0;
        let razonamiento = [];

        // VERIFICACIÓN CRÍTICA: Si esta posición exacta ha tenido una mina antes,
        // establecer el riesgo al máximo absoluto
        if (memoria.mapaCalorMinas && memoria.mapaCalorMinas[clave]) {
            // Esta celda ha tenido una mina antes, establecer riesgo al máximo
            console.log(`¡ALERTA MÁXIMA! Mina previamente registrada en (${fila},${columna}) - normalizada: ${clave}`);
            return {
                factorRiesgo: 1.0, // Máximo riesgo posible
                razonamiento: [`¡MINA CONOCIDA en (${fila},${columna})!`],
                confianza: 'extrema' // Nivel máximo de confianza
            };
        }

        // Verificar también minas en posiciones concretas (no normalizadas)
        // Esto es una doble verificación por si el sistema de normalización fallara
        if (memoria.minasExactas) {
            const claveExacta = `${fila},${columna}`;
            if (memoria.minasExactas[claveExacta]) {
                console.log(`¡ALERTA MÁXIMA! Mina previamente registrada exactamente en (${fila},${columna})`);
                return {
                    factorRiesgo: 1.0,
                    razonamiento: [`¡MINA CONOCIDA exacta en (${fila},${columna})!`],
                    confianza: 'extrema'
                };
            }
        }

        // Verificar minas cercanas (aumenta el riesgo de celdas adyacentes a minas conocidas)
        let minasCercanas = 0;
        if (memoria.mapaCalorMinas) {
            // Comprobar celdas adyacentes normalizadas
            for (let i = -0.1; i <= 0.1; i += 0.1) {
                for (let j = -0.1; j <= 0.1; j += 0.1) {
                    if (i === 0 && j === 0) continue; // Saltar la celda central

                    const claveAdyacente = `${Math.round((posNorm.filaNorm + i) * 10) / 10},${Math.round((posNorm.columnaNorm + j) * 10) / 10}`;

                    if (memoria.mapaCalorMinas[claveAdyacente]) {
                        minasCercanas++;
                        console.log(`Mina cercana detectada en: ${claveAdyacente}`);
                    }
                }
            }

            // Ajustar factor de riesgo según minas cercanas
            if (minasCercanas > 0) {
                const riesgoPorProximidad = Math.min(0.7, minasCercanas * 0.2);
                factorRiesgo += riesgoPorProximidad;
                razonamiento.push(`${minasCercanas} minas cercanas detectadas`);
            }
        }

        // Verificar si esta celda ha tenido minas en el pasado (histórico general)
        if (memoria.mapaCalorMinas) {
            // Buscar celdas con coordenadas similares (para manejar inexactitudes en normalización)
            const umbralSimilitud = 0.05;
            const clavesSimilares = Object.keys(memoria.mapaCalorMinas).filter(k => {
                try {
                    const [fNorm, cNorm] = k.split(',').map(parseFloat);
                    return Math.abs(fNorm - posNorm.filaNorm) <= umbralSimilitud &&
                        Math.abs(cNorm - posNorm.columnaNorm) <= umbralSimilitud;
                } catch {
                    return false;
                }
            });

            if (clavesSimilares.length > 0) {
                const acumuladoFrecuencia = clavesSimilares.reduce((acc, k) => acc + memoria.mapaCalorMinas[k], 0);
                // Más ocurrencias = más riesgo, con un máximo de 0.8
                const riesgoPorFrecuencia = Math.min(0.8, acumuladoFrecuencia * 0.25);
                factorRiesgo += riesgoPorFrecuencia;
                razonamiento.push(`Histórico de ${acumuladoFrecuencia} minas en ubicaciones similares`);
            }
        }

        // Verificar si es un movimiento inicial con historial de derrotas
        if (historialMovimientos.length === 0 && memoria.patrones && memoria.patrones.movimientosIniciales && memoria.patrones.movimientosIniciales[clave]) {
            const stats = memoria.patrones.movimientosIniciales[clave];
            const total = stats.victorias + stats.derrotas;
            if (total > 0) {
                const tasaDerrota = stats.derrotas / total;
                // Mayor impacto de las derrotas históricas
                factorRiesgo += tasaDerrota * 0.5; // Antes era 0.3
                razonamiento.push(`Inicio con ${Math.round(tasaDerrota * 100)}% de derrotas (${stats.derrotas} de ${total})`);
            }
        }

        // Verificar si sería un segundo movimiento con historial negativo
        if (historialMovimientos.length === 1 && !historialMovimientos[0].esAccion && memoria.patrones && memoria.patrones.segundosMovimientos) {
            const movInicial = historialMovimientos[0];
            const posInicialNorm = normalizarPosicion(movInicial.fila, movInicial.columna, tamañoTablero);

            if (posInicialNorm) {
                const claveInicial = `${posInicialNorm.filaNorm},${posInicialNorm.columnaNorm}`;
                const claveSecuencia = `${claveInicial}|${clave}`;

                if (memoria.patrones.segundosMovimientos[claveSecuencia]) {
                    const stats = memoria.patrones.segundosMovimientos[claveSecuencia];
                    const total = stats.victorias + stats.derrotas;
                    if (total > 0) {
                        const tasaDerrota = stats.derrotas / total;
                        // Mayor impacto de los patrones negativos
                        factorRiesgo += tasaDerrota * 0.6; // Antes era 0.4
                        razonamiento.push(`Secuencia con ${Math.round(tasaDerrota * 100)}% de derrotas (${stats.derrotas} de ${total})`);
                    }
                }
            }
        }

        // Verificar si esta celda forma parte de una secuencia perdedora
        if (memoria.patrones && memoria.patrones.secuenciasPerdedoras) {
            const movimientosAnteriores = historialMovimientos
                .filter(mov => !mov.esAccion)
                .map(mov => {
                    const pos = normalizarPosicion(mov.fila, mov.columna, tamañoTablero);
                    return pos ? `${pos.filaNorm},${pos.columnaNorm}` : null;
                })
                .filter(pos => pos !== null);

            // Crear la posible secuencia resultante
            const posibleSecuencia = [...movimientosAnteriores, clave].join('|');

            // Verificar si esta secuencia o una parte de ella ha resultado en derrota antes
            const secuenciasPerdedoras = memoria.patrones.secuenciasPerdedoras.filter(seq =>
                seq.includes(posibleSecuencia) || posibleSecuencia.includes(seq)
            );

            if (secuenciasPerdedoras.length > 0) {
                // Aumentar factor de riesgo basado en cuántas secuencias perdedoras coinciden
                // Mayor impacto de las secuencias perdedoras
                const riesgoSecuencia = Math.min(0.9, secuenciasPerdedoras.length * 0.3); // Antes era 0.75 y 0.25
                factorRiesgo += riesgoSecuencia;
                razonamiento.push(`Secuencia similar a ${secuenciasPerdedoras.length} derrotas previas`);
            }
        }

        // Limitar el factor de riesgo al rango [0, 1]
        factorRiesgo = Math.max(0, Math.min(1, factorRiesgo));

        return {
            factorRiesgo,
            razonamiento: razonamiento.length > 0 ? razonamiento : ["Sin datos históricos"],
            confianza: razonamiento.length > 0 ? 'alta' : 'baja'
        };
    } catch (error) {
        console.error("Error en evaluarCeldaConMemoria:", error);
        return { factorRiesgo: 0, razonamiento: ["Error en evaluación de memoria"] };
    }
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
    // Validar parámetros
    if (fila === undefined || columna === undefined || !tamañoTablero ||
        tamañoTablero.filas === undefined || tamañoTablero.columnas === undefined) {
        console.warn("Parámetros inválidos en normalizarPosicion:", { fila, columna, tamañoTablero });
        return null;
    }

    try {
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
    } catch (error) {
        console.error("Error en normalizarPosicion:", error);
        return null;
    }
};

/**
 * Guarda la memoria en el almacenamiento local
 * @param {Object} memoria - Objeto de memoria a guardar
 */
export const guardarMemoria = (memoria) => {
    if (!memoria) {
        console.warn("Intento de guardar memoria nula o indefinida");
        return;
    }

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
    if (!memoria || !primerMovimiento || !tamañoTablero) {
        console.warn("Parámetros inválidos en determinarMejorSegundoMovimiento");
        return null;
    }

    try {
        // Normalizar la posición del primer movimiento
        const posNorm = normalizarPosicion(primerMovimiento.fila, primerMovimiento.columna, tamañoTablero);
        if (!posNorm) return null;

        const clavePrimero = `${posNorm.filaNorm},${posNorm.columnaNorm}`;

        // Verificar que los patrones existan
        if (!memoria.patrones || !memoria.patrones.segundosMovimientos) {
            return null;
        }

        // Buscar todos los segundos movimientos que siguen a este primer movimiento
        const segundosMovimientosPosibles = [];

        for (const clave in memoria.patrones.segundosMovimientos) {
            if (clave.startsWith(clavePrimero + '|')) {
                const segundaParte = clave.split('|')[1];
                const [filaNorm, columnaNorm] = segundaParte.split(',').map(parseFloat);
                const stats = memoria.patrones.segundosMovimientos[clave];
                const total = stats.victorias + stats.derrotas;
                const tasaExito = total > 0 ? stats.victorias / total : 0;

                // Denormalizar las coordenadas al tamaño actual del tablero
                const fila = Math.round(filaNorm * (tamañoTablero.filas - 1));
                const columna = Math.round(columnaNorm * (tamañoTablero.columnas - 1));

                segundosMovimientosPosibles.push({
                    fila,
                    columna,
                    tasaExito,
                    total
                });
            }
        }

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
    } catch (error) {
        console.error("Error en determinarMejorSegundoMovimiento:", error);
        return null;
    }
};