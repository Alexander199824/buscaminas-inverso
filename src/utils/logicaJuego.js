/**
 * Implementación de lógica de buscaminas con análisis global y resolución avanzada
 */

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
};

/**
 * Seleccionar una celda aleatoria para el primer movimiento
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
    
    // Agregar aleatoriedad usando múltiples factores
    const timestamp = Date.now();
    const randomFactor = Math.random();
    
    const filaAleatoria = Math.floor(randomFactor * filas);
    const columnaAleatoria = Math.floor((timestamp % 1000) / 1000 * columnas);
    
    return { fila: filaAleatoria, columna: columnaAleatoria };
};

/**
 * Analizar el tablero para tomar decisiones estratégicas
 * Versión avanzada con análisis global del tablero
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
        // 1. ANÁLISIS LOCAL BÁSICO
        // Buscar celdas para colocar banderas (minas 100% confirmadas)
        const nuevasBanderas = buscarCeldasParaBanderas(tablero, tamañoTablero, celdasDescubiertas, banderas);
        
        // 2. ANÁLISIS GLOBAL DEL TABLERO
        // Buscar banderas y celdas seguras adicionales mediante análisis avanzado
        const resultadoAnalisisGlobal = realizarAnalisisGlobal(tablero, tamañoTablero, celdasDescubiertas, [...banderas, ...nuevasBanderas]);
        
        // Combinar resultados del análisis global (sin duplicados)
        const todasLasBanderas = [...nuevasBanderas];
        
        // Añadir banderas del análisis global
        resultadoAnalisisGlobal.banderasEncontradas.forEach(bandera => {
            if (!todasLasBanderas.some(b => b.fila === bandera.fila && b.columna === bandera.columna) &&
                !banderas.some(b => b.fila === bandera.fila && b.columna === bandera.columna)) {
                todasLasBanderas.push(bandera);
            }
        });
        
        // 3. DETERMINAR SIGUIENTE JUGADA
        let siguienteCelda = null;
        
        // Primera prioridad: Celdas seguras encontradas por el análisis global
        if (resultadoAnalisisGlobal.celdasSeguras.length > 0) {
            const indiceAleatorio = Math.floor(Math.random() * resultadoAnalisisGlobal.celdasSeguras.length);
            siguienteCelda = resultadoAnalisisGlobal.celdasSeguras[indiceAleatorio];
            
            if (setMensajeSistema) {
                setMensajeSistema(`Análisis global: He encontrado una celda segura en (${siguienteCelda.fila + 1},${siguienteCelda.columna + 1}).`);
            }
        } 
        // Segunda prioridad: Análisis de riesgo y probabilidades
        else {
            siguienteCelda = encontrarMejorJugada(tablero, tamañoTablero, celdasDescubiertas, 
                [...banderas, ...todasLasBanderas], resultadoAnalisisGlobal);
        }
        
        // 4. GENERAR MOVIMIENTOS PARA NUEVAS BANDERAS
        const movimientosGenerados = todasLasBanderas.map(bandera => ({
            fila: bandera.fila,
            columna: bandera.columna,
            esAccion: true,
            accion: "bandera"
        }));
        
        // Si hay banderas nuevas, actualizar mensaje
        if (todasLasBanderas.length > 0 && setMensajeSistema) {
            setMensajeSistema(`He identificado ${todasLasBanderas.length} mina${todasLasBanderas.length > 1 ? 's' : ''} con certeza y las he marcado con banderas.`);
            if (setAnimacion) setAnimacion('bandera');
        }
        
        // Si hay siguiente celda, actualizar mensaje
        if (siguienteCelda && setMensajeSistema && !todasLasBanderas.length) {
            const origen = siguienteCelda.tipoAnalisis ? `(${siguienteCelda.tipoAnalisis})` : '';
            const mensaje = `Seleccionando la casilla (${siguienteCelda.fila + 1},${siguienteCelda.columna + 1}) ${origen}`;
            setMensajeSistema(mensaje);
        }
        
        return {
            banderas: [...banderas, ...todasLasBanderas],
            siguienteCelda,
            movimientosGenerados
        };
    } catch (error) {
        console.error("Error al analizar tablero:", error);
        // En caso de error, devolver estado actual sin cambios
        return {
            banderas: banderas || [],
            siguienteCelda: seleccionarCeldaAleatoria(tablero, tamañoTablero, celdasDescubiertas, banderas),
            movimientosGenerados: []
        };
    }
};

/**
 * Buscar celdas donde colocar banderas (100% certeza de mina)
 * @private
 */
const buscarCeldasParaBanderas = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    const nuevasBanderas = [];
    
    // Validar parámetros
    if (!tablero || !tamañoTablero || !celdasDescubiertas || !banderas) {
        return nuevasBanderas;
    }
    
    // Recorrer celdas con números
    celdasDescubiertas.forEach(celda => {
        const { fila, columna } = celda;
        
        // Validar que la celda tiene coordenadas válidas
        if (fila === undefined || columna === undefined || 
            fila < 0 || columna < 0 ||
            fila >= tablero.length || columna >= tablero[0].length) {
            return;
        }
        
        const valor = tablero[fila][columna];
        
        // Solo procesar celdas con números > 0
        if (!valor || isNaN(valor) || valor === '0' || valor === '') {
            return;
        }
        
        const numeroMinas = parseInt(valor);
        
        // Si no hay minas, no hay banderas que colocar
        if (numeroMinas <= 0) {
            return;
        }
        
        // Obtener celdas adyacentes
        const celdasAdyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
        
        // Contar banderas ya colocadas
        const banderasAdyacentes = celdasAdyacentes.filter(c => 
            banderas.some(b => b.fila === c.fila && b.columna === c.columna) ||
            nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)
        );
        
        // Celdas sin descubrir y sin bandera
        const celdasSinDescubrir = celdasAdyacentes.filter(c => 
            !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
            !banderas.some(b => b.fila === c.fila && b.columna === c.columna) &&
            !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)
        );
        
        // Si faltan minas y son exactamente las celdas sin descubrir, colocar banderas
        if (numeroMinas - banderasAdyacentes.length === celdasSinDescubrir.length && 
            celdasSinDescubrir.length > 0) {
            // Todas las celdas sin descubrir tienen minas
            celdasSinDescubrir.forEach(c => {
                if (!nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                    nuevasBanderas.push(c);
                }
            });
        }
    });
    
    return nuevasBanderas;
};

/**
 * Realizar un análisis global del tablero para detectar situaciones que no pueden
 * resolverse mediante análisis local simple.
 * 
 * Implementa técnicas avanzadas como:
 * 1. Análisis de subconjuntos
 * 2. Identificación de patrones comunes (1-2-1, etc.)
 * 3. Cálculo de restricciones
 * 4. Resolver sistemas de ecuaciones lineales para determinar minas
 * 
 * @param {Array} tablero - Estado actual del tablero
 * @param {object} tamañoTablero - Tamaño del tablero
 * @param {Array} celdasDescubiertas - Celdas ya descubiertas
 * @param {Array} banderas - Banderas colocadas (incluyendo nuevas)
 * @returns {object} - Resultado del análisis global
 */
const realizarAnalisisGlobal = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    // Filtrar solo celdas numéricas (las que tienen valores 1-8)
    const celdasNumericas = celdasDescubiertas.filter(celda => {
        const valor = tablero[celda.fila][celda.columna];
        return valor && !isNaN(valor) && parseInt(valor) > 0;
    });
    
    // Preparar estructuras para los resultados
    const banderasEncontradas = [];   // Celdas que definitivamente tienen minas
    const celdasSeguras = [];         // Celdas que definitivamente NO tienen minas
    const celdasAmbiguas = [];        // Celdas donde no podemos determinar con certeza
    
    // 1. CONSTRUIR SISTEMAS DE RESTRICCIONES
    
    // Cada restricción es un conjunto de celdas y un número (cuántas minas debe contener)
    const restricciones = [];
    
    // Para cada celda numérica, crear una restricción
    celdasNumericas.forEach(celda => {
        const { fila, columna } = celda;
        const valor = parseInt(tablero[fila][columna]);
        
        // Obtener celdas adyacentes sin descubrir
        const adyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
        const celdasRelevantes = adyacentes.filter(c => 
            !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna)
        );
        
        // Contar banderas ya colocadas
        const banderasColocadas = celdasRelevantes.filter(c => 
            banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        );
        
        // Obtener celdas sin bandera (donde podrían estar las minas restantes)
        const celdasSinBandera = celdasRelevantes.filter(c => 
            !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        );
        
        // Si aún faltan minas por colocar y hay celdas sin bandera
        if (valor - banderasColocadas.length > 0 && celdasSinBandera.length > 0) {
            restricciones.push({
                celdas: celdasSinBandera,
                minasFaltantes: valor - banderasColocadas.length,
                celdaOrigen: { fila, columna, valor }
            });
        }
    });
    
    // 2. ANÁLISIS DE SUBCONJUNTOS
    // Buscar patrones donde una restricción es subconjunto de otra
    for (let i = 0; i < restricciones.length; i++) {
        const r1 = restricciones[i];
        
        for (let j = 0; j < restricciones.length; j++) {
            if (i === j) continue;
            
            const r2 = restricciones[j];
            
            // Verificar si todas las celdas de r1 están contenidas en r2
            const r1EsSubconjuntoDeR2 = esSubconjunto(r1.celdas, r2.celdas);
            
            if (r1EsSubconjuntoDeR2) {
                // Si r1 es subconjunto de r2, podemos hacer "resta de conjuntos"
                const celdasDiferencia = r2.celdas.filter(c2 => 
                    !r1.celdas.some(c1 => c1.fila === c2.fila && c1.columna === c2.columna)
                );
                
                const minasDiferencia = r2.minasFaltantes - r1.minasFaltantes;
                
                // Si todas las minas de la diferencia están en las celdas de la diferencia
                if (celdasDiferencia.length === minasDiferencia && minasDiferencia > 0) {
                    // Todas las celdas de la diferencia tienen minas
                    celdasDiferencia.forEach(c => {
                        if (!banderasEncontradas.some(b => b.fila === c.fila && b.columna === c.columna) &&
                            !banderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                            banderasEncontradas.push({
                                fila: c.fila,
                                columna: c.columna,
                                origen: 'subconjunto'
                            });
                        }
                    });
                }
                
                // Si no hay minas en la diferencia, todas esas celdas son seguras
                if (minasDiferencia === 0 && celdasDiferencia.length > 0) {
                    celdasDiferencia.forEach(c => {
                        if (!celdasSeguras.some(s => s.fila === c.fila && s.columna === c.columna)) {
                            celdasSeguras.push({
                                fila: c.fila,
                                columna: c.columna,
                                tipoAnalisis: 'análisis de subconjuntos'
                            });
                        }
                    });
                }
            }
        }
    }
    
    // 3. ANÁLISIS DE PATRONES COMUNES
    
    // Detectar patrones 1-2-1 (y variantes)
    detectarPatron121(tablero, tamañoTablero, celdasDescubiertas, banderas, banderasEncontradas, celdasSeguras);
    
    // 4. ANÁLISIS DE CONTADORES Y GRUPOS
    
    // Buscar celdas que forman un grupo cerrado de restricciones
    const gruposCerrados = identificarGruposCerrados(restricciones, tamañoTablero);
    
    // Analizar cada grupo cerrado para encontrar celdas seguras o con minas
    gruposCerrados.forEach(grupo => {
        const resultadoGrupo = analizarGrupoCerrado(grupo, banderas);
        
        // Añadir las banderas encontradas
        resultadoGrupo.banderasEncontradas.forEach(b => {
            if (!banderasEncontradas.some(bf => bf.fila === b.fila && bf.columna === b.columna) &&
                !banderas.some(bf => bf.fila === b.fila && bf.columna === b.columna)) {
                banderasEncontradas.push({
                    fila: b.fila,
                    columna: b.columna,
                    origen: 'grupo cerrado'
                });
            }
        });
        
        // Añadir las celdas seguras
        resultadoGrupo.celdasSeguras.forEach(s => {
            if (!celdasSeguras.some(cs => cs.fila === s.fila && cs.columna === s.columna)) {
                celdasSeguras.push({
                    fila: s.fila,
                    columna: s.columna,
                    tipoAnalisis: 'análisis de grupo cerrado'
                });
            }
        });
    });
    
    // 5. CÁLCULO DE PROBABILIDADES AVANZADO
    
    // Después de todos los análisis determinísticos, calcular probabilidades
    const mapaProbabilidades = calcularProbabilidadesAvanzadas(
        tablero, tamañoTablero, celdasDescubiertas, banderas, restricciones,
        banderasEncontradas, celdasSeguras
    );
    
    return {
        banderasEncontradas,
        celdasSeguras,
        celdasAmbiguas,
        mapaProbabilidades
    };
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

/**
 * Detectar patrones específicos como 1-2-1 y sus variantes
 * Este patrón es común en buscaminas y permite identificar celdas seguras
 */
const detectarPatron121 = (tablero, tamañoTablero, celdasDescubiertas, banderas, banderasEncontradas, celdasSeguras) => {
    const { filas, columnas } = tamañoTablero;
    
    // Buscamos patrones horizontales y verticales
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
                
                // Verificar si las tres celdas están descubiertas
                const celda1Descubierta = celdasDescubiertas.some(c => c.fila === pos1.fila && c.columna === pos1.columna);
                const celda2Descubierta = celdasDescubiertas.some(c => c.fila === pos2.fila && c.columna === pos2.columna);
                const celda3Descubierta = celdasDescubiertas.some(c => c.fila === pos3.fila && c.columna === pos3.columna);
                
                // Solo procesar si las tres celdas están descubiertas
                if (celda1Descubierta && celda2Descubierta && celda3Descubierta) {
                    const valor1 = tablero[pos1.fila][pos1.columna];
                    const valor2 = tablero[pos2.fila][pos2.columna];
                    const valor3 = tablero[pos3.fila][pos3.columna];
                    
                    // Verificar si es un patrón 1-2-1
                    if (valor1 === '1' && valor2 === '2' && valor3 === '1') {
                        // Buscar las celdas adyacentes al 2 que no son adyacentes a los 1
                        const adyacentesA2 = obtenerCeldasAdyacentes(pos2.fila, pos2.columna, tamañoTablero);
                        const adyacentesA1 = obtenerCeldasAdyacentes(pos1.fila, pos1.columna, tamañoTablero);
                        const adyacentesA3 = obtenerCeldasAdyacentes(pos3.fila, pos3.columna, tamañoTablero);
                        
                        // Celdas únicas del 2
                        const celdasUnicas = adyacentesA2.filter(c2 => 
                            !adyacentesA1.some(c1 => c1.fila === c2.fila && c1.columna === c2.columna) &&
                            !adyacentesA3.some(c3 => c3.fila === c2.fila && c3.columna === c2.columna)
                        );
                        
                        // Si hay exactamente 2 celdas únicas, son minas
                        if (celdasUnicas.length === 2) {
                            // Verificar si no están descubiertas y no tienen bandera
                            const celdasValidasParaMinas = celdasUnicas.filter(c => 
                                !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
                                !banderas.some(b => b.fila === c.fila && b.columna === c.columna) &&
                                !banderasEncontradas.some(b => b.fila === c.fila && b.columna === c.columna)
                            );
                            
                            // Añadir como banderas
                            celdasValidasParaMinas.forEach(c => {
                                banderasEncontradas.push({
                                    fila: c.fila,
                                    columna: c.columna,
                                    origen: 'patrón 1-2-1'
                                });
                            });
                            
                            // Celdas adyacentes a los 1 (no al 2) son seguras
                            const celdasSegurasPosibles = [
                                ...adyacentesA1.filter(c1 => 
                                    !adyacentesA2.some(c2 => c1.fila === c2.fila && c1.columna === c2.columna)
                                ),
                                ...adyacentesA3.filter(c3 => 
                                    !adyacentesA2.some(c2 => c3.fila === c2.fila && c3.columna === c2.columna)
                                )
                            ];
                            
                            // Eliminar duplicados y validar
                            const celdasSegurasFiltradas = celdasSegurasPosibles.filter((c, index, self) => 
                                index === self.findIndex(s => s.fila === c.fila && s.columna === c.columna) &&
                                !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
                                !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
                            );
                            
                            // Añadir como celdas seguras
                            celdasSegurasFiltradas.forEach(c => {
                                if (!celdasSeguras.some(cs => cs.fila === c.fila && cs.columna === c.columna)) {
                                    celdasSeguras.push({
                                        fila: c.fila,
                                        columna: c.columna,
                                        tipoAnalisis: 'patrón 1-2-1'
                                    });
                                }
                            });
                        }
                    }
                }
            }
        }
    });
};

/**
 * Identificar grupos cerrados de restricciones donde un conjunto de celdas
 * solo aparece en un conjunto específico de restricciones.
 */
const identificarGruposCerrados = (restricciones, tamañoTablero) => {
    const gruposCerrados = [];
    
    // Para cada subconjunto de restricciones, verificar si forman un grupo cerrado
    // (limitamos el tamaño a 4 para eficiencia)
    for (let i = 0; i < restricciones.length; i++) {
        // Considerar esta restricción como el inicio de un posible grupo
        const grupoRestricciones = [restricciones[i]];
        const celdasDelGrupo = new Set(restricciones[i].celdas.map(c => `${c.fila},${c.columna}`));
        
        // Buscar otras restricciones que compartan celdas con este grupo
        explorarGrupoCerrado(restricciones, i, grupoRestricciones, celdasDelGrupo, 1, 4);
        
        // Verificar si el grupo encontrado es cerrado
        if (grupoRestricciones.length > 1) {
            const esCerrado = verificarGrupoCerrado(grupoRestricciones, celdasDelGrupo);
            
            if (esCerrado) {
                gruposCerrados.push({
                    restricciones: grupoRestricciones,
                    celdas: Array.from(celdasDelGrupo).map(str => {
                        const [fila, columna] = str.split(',').map(Number);
                        return { fila, columna };
                    })
                });
            }
        }
    }
    
    return gruposCerrados;
};

/**
 * Función recursiva para explorar posibles grupos cerrados
 * @private
 */
const explorarGrupoCerrado = (restricciones, indiceActual, grupoRestricciones, celdasDelGrupo, profundidad, maxProfundidad) => {
    // Limitar profundidad de recursión para evitar problemas de rendimiento
    if (profundidad >= maxProfundidad) {
        return;
    }
    
    // Buscar restricciones que compartan celdas con el grupo actual
    for (let j = indiceActual + 1; j < restricciones.length; j++) {
        const restriccion = restricciones[j];
        
        // Verificar si esta restricción comparte alguna celda con el grupo
        const comparteAlgunaCelda = restriccion.celdas.some(c => 
            celdasDelGrupo.has(`${c.fila},${c.columna}`)
        );
        
        if (comparteAlgunaCelda) {
            // Añadir esta restricción al grupo
            grupoRestricciones.push(restriccion);
            
            // Añadir las celdas nuevas al grupo
            restriccion.celdas.forEach(c => {
                celdasDelGrupo.add(`${c.fila},${c.columna}`);
            });
            
            // Continuar explorando recursivamente
            explorarGrupoCerrado(restricciones, j, grupoRestricciones, celdasDelGrupo, profundidad + 1, maxProfundidad);
        }
    }
};

/**
 * Verificar si un grupo de restricciones forma un grupo cerrado
 * Un grupo es cerrado si el número total de minas faltantes coincide con las restricciones
 * @private
 */
const verificarGrupoCerrado = (grupoRestricciones, celdasDelGrupo) => {
    // Contar el total de minas faltantes en el grupo
    const totalMinasFaltantes = grupoRestricciones.reduce((total, r) => total + r.minasFaltantes, 0);
    
    // Contar el número de celdas únicas en el grupo
    const numeroCeldas = celdasDelGrupo.size;
    
    // Para que sea un grupo cerrado válido, debe tener sentido matemáticamente
    return totalMinasFaltantes <= numeroCeldas && totalMinasFaltantes > 0;
};

/**
 * Analizar un grupo cerrado de restricciones para encontrar celdas seguras o con minas
 * @private
 */
const analizarGrupoCerrado = (grupo, banderas) => {
    const { restricciones, celdas } = grupo;
    
    // Resultados del análisis
    const banderasEncontradas = [];
    const celdasSeguras = [];
    
    // Contar total de minas que deben estar en el grupo
    const totalMinasFaltantes = restricciones.reduce((total, r) => total + r.minasFaltantes, 0);
    
    // Si el total de minas es 0, todas las celdas son seguras
    if (totalMinasFaltantes === 0) {
        celdas.forEach(c => {
            if (!banderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                celdasSeguras.push(c);
            }
        });
        return { banderasEncontradas, celdasSeguras };
    }
    
    // Si el total de minas es igual al número de celdas, todas tienen minas
    if (totalMinasFaltantes === celdas.length) {
        celdas.forEach(c => {
            if (!banderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                banderasEncontradas.push(c);
            }
        });
        return { banderasEncontradas, celdasSeguras };
    }
    
    // Para casos más complejos, realizar análisis detallado
    // Construir un sistema de ecuaciones lineales
    // [Este es un enfoque simplificado - para una implementación completa se requeriría
    // un algoritmo de resolución de sistemas de ecuaciones lineales]
    
    // En este caso, vamos a intentar un enfoque basado en combinaciones
    if (celdas.length <= 10) { // Limitamos a grupos pequeños por rendimiento
        // Generar todas las posibles distribuciones de minas en el grupo
        const posiblesCombinaciones = generarCombinacionesMinas(celdas, totalMinasFaltantes);
        
        // Verificar qué combinaciones son válidas según las restricciones
        const combinacionesValidas = posiblesCombinaciones.filter(combinacion => 
            esDistribucionValida(combinacion, restricciones)
        );
        
        // Si hay combinaciones válidas, buscar celdas comunes
        if (combinacionesValidas.length > 0) {
            // Celdas que tienen mina en todas las combinaciones válidas
            const celdasConMinaEnTodas = celdas.filter(celda => 
                combinacionesValidas.every(comb => 
                    comb.some(c => c.fila === celda.fila && c.columna === celda.columna)
                )
            );
            
            // Celdas que no tienen mina en ninguna combinación válida
            const celdasSinMinaEnTodas = celdas.filter(celda => 
                combinacionesValidas.every(comb => 
                    !comb.some(c => c.fila === celda.fila && c.columna === celda.columna)
                )
            );
            
            // Añadir resultados
            celdasConMinaEnTodas.forEach(c => {
                if (!banderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                    banderasEncontradas.push(c);
                }
            });
            
            celdasSinMinaEnTodas.forEach(c => {
                if (!banderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                    celdasSeguras.push(c);
                }
            });
        }
    }
    
    return { banderasEncontradas, celdasSeguras };
};

/**
 * Genera todas las posibles combinaciones de distribución de minas en un grupo de celdas
 * @private
 */
const generarCombinacionesMinas = (celdas, totalMinas) => {
    // Para grupos pequeños, generamos todas las combinaciones
    // Esta función es una versión simplificada, para grupos grandes se requeriría
    // un enfoque más eficiente o probabilístico
    
    const result = [];
    
    // Función recursiva para generar combinaciones
    const generarCombinacionesRecursiva = (startIndex, currentCombination) => {
        if (currentCombination.length === totalMinas) {
            result.push([...currentCombination]);
            return;
        }
        
        for (let i = startIndex; i < celdas.length; i++) {
            currentCombination.push(celdas[i]);
            generarCombinacionesRecursiva(i + 1, currentCombination);
            currentCombination.pop();
        }
    };
    
    generarCombinacionesRecursiva(0, []);
    return result;
};

/**
 * Verifica si una distribución de minas satisface todas las restricciones
 * @private
 */
const esDistribucionValida = (combinacion, restricciones) => {
    return restricciones.every(restriccion => {
        // Contar cuántas minas de la combinación están en las celdas de esta restricción
        const minasEnRestriccion = combinacion.filter(celda => 
            restriccion.celdas.some(c => c.fila === celda.fila && c.columna === celda.columna)
        ).length;
        
        // La distribución es válida si el número de minas coincide con lo esperado
        return minasEnRestriccion === restriccion.minasFaltantes;
    });
};

/**
 * Calcular probabilidades avanzadas para todas las celdas del tablero
 * @private
 */
const calcularProbabilidadesAvanzadas = (tablero, tamañoTablero, celdasDescubiertas, banderas, restricciones, banderasEncontradas, celdasSeguras) => {
    const { filas, columnas } = tamañoTablero;
    const mapaProbabilidades = {};
    
    // Inicializar mapa con probabilidad base para todas las celdas no descubiertas
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            // Clave única para cada celda
            const clave = `${i},${j}`;
            
            // Verificar si la celda ya está descubierta o tiene bandera
            const estaDescubierta = celdasDescubiertas.some(c => c.fila === i && c.columna === j);
            const tieneBandera = banderas.some(b => b.fila === i && b.columna === j) || 
                               banderasEncontradas.some(b => b.fila === i && b.columna === j);
            const esSegura = celdasSeguras.some(s => s.fila === i && s.columna === j);
            
            if (!estaDescubierta && !tieneBandera) {
                if (esSegura) {
                    // Celda segura identificada por análisis avanzado
                    mapaProbabilidades[clave] = {
                        probabilidad: 0,
                        certeza: true,
                        origen: 'análisis global'
                    };
                } else {
                    // Probabilidad base para celdas no analizadas
                    mapaProbabilidades[clave] = {
                        probabilidad: 0.15, // Valor conservador por defecto
                        certeza: false,
                        origen: 'valor base'
                    };
                }
            }
        }
    }
    
    // Identificar celdas que pertenecen a restricciones
    const celdasEnRestricciones = new Set();
    
    // Para cada restricción, actualizar probabilidades
    restricciones.forEach(restriccion => {
        // Solo procesar restricciones con celdas y minas pendientes
        if (restriccion.celdas.length > 0 && restriccion.minasFaltantes > 0) {
            const probabilidad = restriccion.minasFaltantes / restriccion.celdas.length;
            
            restriccion.celdas.forEach(celda => {
                const clave = `${celda.fila},${celda.columna}`;
                celdasEnRestricciones.add(clave);
                
                // Si no es una celda ya identificada como segura
                if (!celdasSeguras.some(s => s.fila === celda.fila && s.columna === celda.columna)) {
                    // Actualizar solo si la nueva probabilidad es mayor (enfoque conservador)
                    if (!mapaProbabilidades[clave] || mapaProbabilidades[clave].probabilidad < probabilidad) {
                        mapaProbabilidades[clave] = {
                            probabilidad,
                            certeza: false,
                            origen: `restricción de ${restriccion.celdaOrigen.fila + 1},${restriccion.celdaOrigen.columna + 1}`
                        };
                    }
                }
            });
        }
    });
    
    // Para celdas que no están en ninguna restricción, reducir su probabilidad
    Object.keys(mapaProbabilidades).forEach(clave => {
        if (!celdasEnRestricciones.has(clave) && mapaProbabilidades[clave].probabilidad === 0.15) {
            mapaProbabilidades[clave].probabilidad = 0.05; // Menor probabilidad para celdas "libres"
            mapaProbabilidades[clave].origen = 'celda libre';
        }
    });
    
    return mapaProbabilidades;
};

/**
 * Encontrar la mejor jugada (celda con menor probabilidad de contener mina)
 * Versión MEJORADA para seleccionar celdas más inteligentemente
 * @private
 */
const encontrarMejorJugada = (tablero, tamañoTablero, celdasDescubiertas, banderas, analisisGlobal) => {
    // Validar parámetros
    if (!tablero || !tamañoTablero || !celdasDescubiertas || !banderas) {
        return seleccionarCeldaAleatoria(tablero, tamañoTablero, celdasDescubiertas, banderas);
    }
    
    // 1. PRIMERA PRIORIDAD: Buscar celdas seguras (0% probabilidad de mina)
    const celdasSeguras = buscarCeldasSeguras(tablero, tamañoTablero, celdasDescubiertas, banderas);
    
    if (celdasSeguras.length > 0) {
        // Elegir una celda segura aleatoriamente
        const indiceAleatorio = Math.floor(Math.random() * celdasSeguras.length);
        const celdaSeleccionada = celdasSeguras[indiceAleatorio];
        celdaSeleccionada.tipoAnalisis = 'celda 100% segura';
        return celdaSeleccionada;
    }
    
    // 2. SEGUNDA PRIORIDAD: Buscar celdas alejadas de números y banderas (menor riesgo)
    const celdasSinRiesgo = buscarCeldasSinRiesgo(tablero, tamañoTablero, celdasDescubiertas, banderas);
    
    if (celdasSinRiesgo.length > 0) {
        // Elegir una de las celdas seguras alejadas de números
        const indiceAleatorio = Math.floor(Math.random() * celdasSinRiesgo.length);
        const celdaSeleccionada = celdasSinRiesgo[indiceAleatorio];
        celdaSeleccionada.tipoAnalisis = 'borde seguro';
        return celdaSeleccionada;
    }
    
    // 3. TERCERA PRIORIDAD: Utilizar mapa de probabilidades del análisis global
    if (analisisGlobal && analisisGlobal.mapaProbabilidades) {
        const celdasConProbabilidad = [];
        
        // Convertir mapa de probabilidades a lista de celdas
        Object.entries(analisisGlobal.mapaProbabilidades).forEach(([clave, info]) => {
            const [fila, columna] = clave.split(',').map(Number);
            
            // Verificar que la celda está disponible
            const estaDescubierta = celdasDescubiertas.some(c => c.fila === fila && c.columna === columna);
            const tieneBandera = banderas.some(b => b.fila === fila && b.columna === columna);
            
            if (!estaDescubierta && !tieneBandera) {
                celdasConProbabilidad.push({
                    fila,
                    columna,
                    probabilidad: info.probabilidad,
                    origen: info.origen
                });
            }
        });
        
        // Si hay celdas con probabilidad calculada
        if (celdasConProbabilidad.length > 0) {
            // Ordenar por probabilidad ascendente (menor probabilidad primero)
            celdasConProbabilidad.sort((a, b) => a.probabilidad - b.probabilidad);
            
            // Tomar la celda con menor probabilidad de mina
            const celdaSeleccionada = {
                fila: celdasConProbabilidad[0].fila,
                columna: celdasConProbabilidad[0].columna,
                tipoAnalisis: `probabilidad ${Math.round(celdasConProbabilidad[0].probabilidad * 100)}%`
            };
            
            return celdaSeleccionada;
        }
    }
    
    // 4. CUARTA PRIORIDAD: Calcular probabilidades detalladas
    const celdasConProbabilidad = calcularProbabilidadesDetalladas(tablero, tamañoTablero, celdasDescubiertas, banderas);
    
    if (celdasConProbabilidad.length > 0) {
        // Ordenar por probabilidad ascendente (menor probabilidad primero)
        celdasConProbabilidad.sort((a, b) => a.probabilidad - b.probabilidad);
        // Tomar la celda con menor probabilidad de contener mina
        const celdaSeleccionada = {
            fila: celdasConProbabilidad[0].fila,
            columna: celdasConProbabilidad[0].columna,
            tipoAnalisis: `probabilidad ${Math.round(celdasConProbabilidad[0].probabilidad * 100)}%`
        };
        
        return celdaSeleccionada;
    }
    
    // 5. ÚLTIMO RECURSO: Si no hay análisis disponible, seleccionar celda aleatoria
    const celdaAleatoria = seleccionarCeldaAleatoria(tablero, tamañoTablero, celdasDescubiertas, banderas);
    
    if (celdaAleatoria) {
        celdaAleatoria.tipoAnalisis = 'aleatorio';
    }
    
    return celdaAleatoria;
};

/**
 * Buscar celdas seguras (0% probabilidad de mina)
 * @private
 */
const buscarCeldasSeguras = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    const celdasSeguras = [];
    
    // Validar parámetros
    if (!tablero || !tamañoTablero || !celdasDescubiertas || !banderas) {
        return celdasSeguras;
    }
    
    // Recorrer celdas con números
    celdasDescubiertas.forEach(celda => {
        const { fila, columna } = celda;
        
        // Validar que la celda tiene coordenadas válidas
        if (fila === undefined || columna === undefined || 
            fila < 0 || columna < 0 ||
            fila >= tablero.length || columna >= tablero[0].length) {
            return;
        }
        
        const valor = tablero[fila][columna];
        
        // Solo procesar celdas con números (incluyendo 0/vacío)
        if (valor === undefined || (isNaN(valor) && valor !== '' && valor !== '0')) {
            return;
        }
        
        const numeroMinas = valor === '' || valor === '0' ? 0 : parseInt(valor);
        
        // Obtener celdas adyacentes
        const celdasAdyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
        
        // Contar banderas adyacentes
        const banderasAdyacentes = celdasAdyacentes.filter(c => 
            banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        ).length;
        
        // Si el número coincide con las banderas, las demás celdas son seguras
        if (banderasAdyacentes === numeroMinas) {
            celdasAdyacentes.forEach(c => {
                // No considerar celdas ya descubiertas o con bandera
                if (celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) ||
                    banderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                    return;
                }
                
                // Agregar a celdas seguras si no está ya
                if (!celdasSeguras.some(s => s.fila === c.fila && s.columna === c.columna)) {
                    celdasSeguras.push(c);
                }
            });
        }
    });
    
    return celdasSeguras;
};

/**
 * Buscar celdas alejadas de números y banderas (menor riesgo)
 * NUEVO método para priorizar celdas seguras que están lejos de números
 * @private
 */
const buscarCeldasSinRiesgo = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    // Validar parámetros
    if (!tablero || !tamañoTablero || !celdasDescubiertas || !banderas) {
        return [];
    }
    
    const { filas, columnas } = tamañoTablero;
    const celdasDisponibles = [];
    
    // Crear un mapa de riesgo: inicializado a 0 para todas las celdas
    // Un valor más alto = más riesgo (más números cercanos)
    const mapaRiesgo = Array(filas).fill().map(() => Array(columnas).fill(0));
    
    // Para cada celda con número o bandera, aumentar el riesgo en las celdas cercanas
    const aumentarRiesgoAlrededor = (fila, columna, valor) => {
        // Alcance del aumento de riesgo (2 celdas de distancia es suficiente)
        const alcance = 2;
        
        // Aumentar riesgo en un área cuadrada alrededor de la celda
        for (let i = Math.max(0, fila - alcance); i <= Math.min(filas - 1, fila + alcance); i++) {
            for (let j = Math.max(0, columna - alcance); j <= Math.min(columnas - 1, columna + alcance); j++) {
                // Calcular distancia Manhattan
                const distancia = Math.abs(i - fila) + Math.abs(j - columna);
                // El riesgo disminuye con la distancia
                if (distancia <= alcance) {
                    // Valor + 1 para números, 2 para banderas (más riesgo)
                    // El valor disminuye con la distancia
                    mapaRiesgo[i][j] += valor / Math.max(1, distancia);
                }
            }
        }
    };
    
    // Aumentar riesgo alrededor de celdas con números
    celdasDescubiertas.forEach(celda => {
        const { fila, columna } = celda;
        const valor = tablero[fila][columna];
        
        // Solo considerar celdas con números > 0
        if (valor && !isNaN(valor) && parseInt(valor) > 0) {
            aumentarRiesgoAlrededor(fila, columna, parseInt(valor));
        }
    });
    
    // Aumentar riesgo alrededor de banderas (más riesgo)
    banderas.forEach(bandera => {
        aumentarRiesgoAlrededor(bandera.fila, bandera.columna, 2);
    });
    
    // Encontrar todas las celdas disponibles y su nivel de riesgo
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            // Verificar si la celda está disponible
            const estaDescubierta = celdasDescubiertas.some(c => c.fila === i && c.columna === j);
            const tieneBandera = banderas.some(b => b.fila === i && b.columna === j);
            
            if (!estaDescubierta && !tieneBandera) {
                celdasDisponibles.push({
                    fila: i,
                    columna: j,
                    riesgo: mapaRiesgo[i][j]
                });
            }
        }
    }
    
    // Ordenar por nivel de riesgo (menor primero)
    celdasDisponibles.sort((a, b) => a.riesgo - b.riesgo);
    
    // Tomar las celdas con menor riesgo (máximo 5)
    // Solo consideramos celdas realmente de bajo riesgo (valor menor a un umbral)
    const UMBRAL_BAJO_RIESGO = 0.5;
    const celdasBajoRiesgo = celdasDisponibles
        .filter(c => c.riesgo < UMBRAL_BAJO_RIESGO)
        .slice(0, 5);
    
    return celdasBajoRiesgo;
};

/**
 * Calcular probabilidades detalladas para todas las celdas
 * @private
 */
const calcularProbabilidadesDetalladas = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    // Validar parámetros
    if (!tablero || !tamañoTablero || !celdasDescubiertas || !banderas) {
        return [];
    }
    
    const { filas, columnas } = tamañoTablero;
    const celdasConProbabilidad = [];
    
    // Para cada celda disponible, calcular probabilidad
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            // Verificar si la celda está disponible
            const estaDescubierta = celdasDescubiertas.some(c => c.fila === i && c.columna === j);
            const tieneBandera = banderas.some(b => b.fila === i && b.columna === j);
            
            if (!estaDescubierta && !tieneBandera) {
                // Calcular probabilidad basada en números adyacentes
                const probabilidad = calcularProbabilidadCelda(i, j, tablero, tamañoTablero, celdasDescubiertas, banderas);
                
                celdasConProbabilidad.push({
                    fila: i,
                    columna: j,
                    probabilidad
                });
            }
        }
    }
    
    return celdasConProbabilidad;
};

/**
 * Calcular la probabilidad de que una celda contenga mina
 * @private
 */
const calcularProbabilidadCelda = (fila, columna, tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    // Obtener celdas numéricas adyacentes a esta celda
    const celdasAdyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
    const celdasNumericasAdyacentes = celdasAdyacentes.filter(c => 
        celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
        tablero[c.fila][c.columna] && !isNaN(tablero[c.fila][c.columna])
    );
    
    // Si no hay celdas numéricas adyacentes, usar una probabilidad baja por defecto
    if (celdasNumericasAdyacentes.length === 0) {
        return 0.1; // Valor bajo pero no cero
    }
    
    // Calcular probabilidad basada en celdas numéricas adyacentes
    let probabilidadMaxima = 0;
    
    celdasNumericasAdyacentes.forEach(celdaNumerica => {
        const { fila: filaN, columna: columnaN } = celdaNumerica;
        const valor = parseInt(tablero[filaN][columnaN]);
        
        // Obtener celdas adyacentes a la celda numérica
        const celdasAdyacentesN = obtenerCeldasAdyacentes(filaN, columnaN, tamañoTablero);
        
        // Contar banderas y celdas sin descubrir
        const banderasAdyacentes = celdasAdyacentesN.filter(c => 
            banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        ).length;
        
        const celdasSinDescubrir = celdasAdyacentesN.filter(c => 
            !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
            !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        ).length;
        
        // Calcular probabilidad para esta celda numérica
        if (celdasSinDescubrir > 0) {
            const probabilidadLocal = (valor - banderasAdyacentes) / celdasSinDescubrir;
            // Considerar la probabilidad más alta entre todas las celdas numéricas adyacentes
            probabilidadMaxima = Math.max(probabilidadMaxima, probabilidadLocal);
        }
    });
    
    return probabilidadMaxima;
};

/**
 * Seleccionar una celda aleatoria entre las disponibles
 * @private
 */
const seleccionarCeldaAleatoria = (tablero, tamañoTablero, celdasDescubiertas, banderas) => {
    // Validar parámetros
    if (!tablero || !Array.isArray(tablero) || tablero.length === 0 || 
        !tamañoTablero || !tamañoTablero.filas || !tamañoTablero.columnas) {
        console.error("Error al seleccionar celda aleatoria: parámetros inválidos");
        // Retornar un valor por defecto seguro
        return { fila: 0, columna: 0 };
    }
    
    // Lista de celdas disponibles (no descubiertas y sin bandera)
    const celdasDisponibles = [];
    
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
            
           // Si no está descubierta y no tiene bandera, está disponible
           if (!estaDescubierta && !tieneBandera) {
            celdasDisponibles.push({ fila: i, columna: j });
        }
    }
}

// Si hay celdas disponibles, seleccionar una aleatoriamente
if (celdasDisponibles.length > 0) {
    const indiceAleatorio = Math.floor(Math.random() * celdasDisponibles.length);
    return celdasDisponibles[indiceAleatorio];
}

// Si no hay celdas disponibles (raro), retornar null
return null;
};