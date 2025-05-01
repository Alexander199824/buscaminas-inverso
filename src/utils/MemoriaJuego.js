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
        let nivel = "bajo";

        // VERIFICACIÓN CRÍTICA 1: Posiciones exactas con minas
        if (memoria.minasExactas) {
            const claveExacta = `${fila},${columna}`;
            if (memoria.minasExactas[claveExacta]) {
                // Verificar cuántas veces se ha encontrado mina en esta posición exacta
                const ocurrencias = memoria.minasExactas[claveExacta].ocurrencias || 1;
                
                // Calcular el factor de riesgo basado en ocurrencias (más ocurrencias = más confianza)
                // 1.0 es el máximo riesgo posible
                const riesgoExacto = Math.min(1.0, ocurrencias * 0.4);
                
                // Verificar si corresponde al mismo tamaño de tablero (mayor precisión)
                let mismoTablero = false;
                if (memoria.minasExactas[claveExacta].ultimoTablero && 
                    memoria.minasExactas[claveExacta].ultimoTablero.filas === tamañoTablero.filas &&
                    memoria.minasExactas[claveExacta].ultimoTablero.columnas === tamañoTablero.columnas) {
                    mismoTablero = true;
                }
                
                // Aumentar si es el mismo tamaño de tablero
                const factorFinal = mismoTablero ? Math.min(1.0, riesgoExacto * 1.5) : riesgoExacto;
                
                return {
                    factorRiesgo: factorFinal,
                    razonamiento: [`¡MINA CONOCIDA en posición exacta (${fila + 1},${columna + 1})! Detectada ${ocurrencias} veces en el historial.`],
                    confianza: ocurrencias > 2 || mismoTablero ? 'extrema' : 'alta'
                };
            }
        }

        // VERIFICACIÓN CRÍTICA 2: Posiciones normalizadas con minas
        if (memoria.mapaCalorMinas && memoria.mapaCalorMinas[clave]) {
            const ocurrencias = memoria.mapaCalorMinas[clave]; 
            
            // Ser más conservador con el riesgo, aumentando progresivamente con más ocurrencias
            // pero nunca llegando a 1.0 solo por posición normalizada
            const riesgoNormalizado = Math.min(0.9, ocurrencias * 0.2);
            
            razonamiento.push(`Posición normalizada con ${ocurrencias} minas históricas`);
            factorRiesgo = Math.max(factorRiesgo, riesgoNormalizado);
            nivel = ocurrencias > 3 ? "alto" : "medio";
        }

        // VERIFICACIÓN 3: Minas cercanas (aumenta el riesgo de celdas adyacentes a minas conocidas)
        // Versión mejorada para detectar agrupaciones de minas
        let minasCercanas = 0;
        let minasAdyacentes = 0;
        
        if (memoria.mapaCalorMinas) {
            // Revisar posiciones cercanas en un radio de 2 celdas
            for (let i = -0.2; i <= 0.2; i += 0.1) {
                for (let j = -0.2; j <= 0.2; j += 0.1) {
                    if (i === 0 && j === 0) continue; // Saltar la celda central
                    
                    // Redondear a 1 decimal para normalización
                    const filaVecina = Math.round((posNorm.filaNorm + i) * 10) / 10;
                    const columnaVecina = Math.round((posNorm.columnaNorm + j) * 10) / 10;
                    
                    // Mantener dentro de rango [0,1]
                    if (filaVecina < 0 || filaVecina > 1 || columnaVecina < 0 || columnaVecina > 1) continue;
                    
                    const claveVecina = `${filaVecina},${columnaVecina}`;
                    
                    if (memoria.mapaCalorMinas[claveVecina]) {
                        minasCercanas++;
                        
                        // Si está directamente adyacente (distancia <= 0.1)
                        if (Math.abs(i) <= 0.1 && Math.abs(j) <= 0.1) {
                            minasAdyacentes++;
                        }
                    }
                }
            }
            
            // Ajustar factor de riesgo según minas cercanas
            if (minasCercanas > 0) {
                // Dar más peso a minas adyacentes directas
                const riesgoPorProximidad = Math.min(0.7, (minasAdyacentes * 0.25) + (minasCercanas * 0.05));
                factorRiesgo += riesgoPorProximidad;
                
                razonamiento.push(`${minasAdyacentes} minas adyacentes y ${minasCercanas-minasAdyacentes} minas cercanas detectadas`);
                nivel = minasAdyacentes > 1 ? "alto" : "medio";
            }
        }

        // VERIFICACIÓN 4: Análisis de movimientos históricos
        if (historialMovimientos && historialMovimientos.length > 0) {
            // Verificar la existencia de secuencias similares que llevaron a derrotas
            // Esto es crítico para evitar repetir errores
            
            // Convertir movimientos actuales a formato normalizado
            const secuenciaActual = historialMovimientos
                .filter(mov => !mov.esAccion) // Solo movimientos, no banderas
                .map(mov => {
                    const pos = normalizarPosicion(mov.fila, mov.columna, tamañoTablero);
                    return pos ? `${pos.filaNorm},${pos.columnaNorm}` : null;
                })
                .filter(pos => pos !== null);
            
            // Verificar si existe una secuencia perdedora similar
            if (memoria.patrones && memoria.patrones.secuenciasPerdedoras) {
                // Construir la posible secuencia resultante con esta celda
                const posibleSecuencia = [...secuenciaActual, clave].join('|');
                
                // Buscar coincidencias parciales (no necesita ser exacta)
                let coincidenciasEncontradas = 0;
                let coincidenciaExacta = false;
                
                memoria.patrones.secuenciasPerdedoras.forEach(secuencia => {
                    // Si la secuencia histórica contiene exactamente nuestra posible secuencia
                    if (secuencia.includes(posibleSecuencia)) {
                        coincidenciasEncontradas += 2; // Doble peso para coincidencias exactas
                        coincidenciaExacta = true;
                    }
                    // Verificar también coincidencias parciales significativas
                    else if (tienenSuficientesMovimientosComunes(secuencia, posibleSecuencia, 3)) {
                        coincidenciasEncontradas += 1;
                    }
                });
                
                if (coincidenciasEncontradas > 0) {
                    // Peso mayor para coincidencias exactas
                    const riesgoSecuencia = coincidenciaExacta ? 
                        Math.min(0.95, 0.6 + (coincidenciasEncontradas * 0.15)) : 
                        Math.min(0.7, 0.3 + (coincidenciasEncontradas * 0.1));
                    
                    factorRiesgo += riesgoSecuencia;
                    
                    razonamiento.push(`${coincidenciaExacta ? 'SECUENCIA EXACTA' : 'Secuencia similar'} a ${coincidenciasEncontradas} derrotas históricas`);
                    nivel = coincidenciaExacta ? "extremo" : "alto";
                }
            }
            
            // VERIFICACIÓN 5: Patrón de primer movimiento con historial negativo
            if (historialMovimientos.length === 0) {
                if (memoria.patrones && memoria.patrones.movimientosIniciales && memoria.patrones.movimientosIniciales[clave]) {
                    const stats = memoria.patrones.movimientosIniciales[clave];
                    const total = stats.victorias + stats.derrotas;
                    
                    if (total > 0) {
                        const tasaDerrota = stats.derrotas / total;
                        
                        // Mayor impacto para evitar empezar con celdas "malditas"
                        const riesgoInicio = tasaDerrota * 0.7; // Aumentado de 0.5
                        factorRiesgo += riesgoInicio;
                        
                        razonamiento.push(`Inicio con ${Math.round(tasaDerrota * 100)}% de derrotas (${stats.derrotas} de ${total})`);
                        nivel = tasaDerrota > 0.5 ? "alto" : "medio";
                    }
                }
            }
            // VERIFICACIÓN 6: Patrón de segundo movimiento con historial negativo
            else if (historialMovimientos.length === 1 && !historialMovimientos[0].esAccion) {
                const movInicial = historialMovimientos[0];
                const posInicialNorm = normalizarPosicion(movInicial.fila, movInicial.columna, tamañoTablero);

                if (posInicialNorm && memoria.patrones && memoria.patrones.segundosMovimientos) {
                    const claveInicial = `${posInicialNorm.filaNorm},${posInicialNorm.columnaNorm}`;
                    const claveSecuencia = `${claveInicial}|${clave}`;

                    if (memoria.patrones.segundosMovimientos[claveSecuencia]) {
                        const stats = memoria.patrones.segundosMovimientos[claveSecuencia];
                        const total = stats.victorias + stats.derrotas;
                        
                        if (total > 0) {
                            const tasaDerrota = stats.derrotas / total;
                            
                            // Mayor impacto para evitar segundos movimientos problemáticos
                            const riesgoSegundo = Math.min(0.9, tasaDerrota * 0.8); // Aumentado de 0.6
                            factorRiesgo += riesgoSegundo;
                            
                            razonamiento.push(`Secuencia con ${Math.round(tasaDerrota * 100)}% de derrotas (${stats.derrotas} de ${total})`);
                            nivel = tasaDerrota > 0.7 ? "alto" : "medio";
                        }
                    }
                }
            }
        }

        // Limitar el factor de riesgo al rango [0, 1]
        factorRiesgo = Math.max(0, Math.min(1, factorRiesgo));
        
        // Asignar nivel de confianza basado en la evidencia acumulada
        let confianza = 'baja';
        if (factorRiesgo > 0.7 || nivel === "extremo") {
            confianza = 'extrema';
        } else if (factorRiesgo > 0.4 || nivel === "alto") {
            confianza = 'alta';
        } else if (factorRiesgo > 0.2 || nivel === "medio") {
            confianza = 'media';
        }
        
        // Si no hay razonamiento, agregar algo por defecto
        if (razonamiento.length === 0) {
            razonamiento.push("Sin datos históricos significativos");
        }

        return {
            factorRiesgo,
            razonamiento,
            confianza
        };
    } catch (error) {
        console.error("Error en evaluarCeldaConMemoria:", error);
        return { factorRiesgo: 0, razonamiento: ["Error en evaluación de memoria"] };
    }
};

/**
 * Verifica si dos secuencias de movimientos comparten suficientes elementos comunes
 * @param {string} secuencia1 - Primera secuencia de movimientos (formato "pos1|pos2|...")
 * @param {string} secuencia2 - Segunda secuencia de movimientos
 * @param {number} minimo - Mínimo de elementos comunes requeridos
 * @returns {boolean} - true si comparten suficientes elementos
 */
const tienenSuficientesMovimientosComunes = (secuencia1, secuencia2, minimo) => {
    if (!secuencia1 || !secuencia2) return false;
    
    const movimientos1 = secuencia1.split('|');
    const movimientos2 = secuencia2.split('|');
    
    // Si alguna secuencia es muy corta, verificar directamente
    if (movimientos1.length < minimo || movimientos2.length < minimo) {
        return false;
    }
    
    // Contar elementos comunes
    let comunes = 0;
    for (const mov1 of movimientos1) {
        if (movimientos2.includes(mov1)) {
            comunes++;
        }
    }
    
    return comunes >= minimo;
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