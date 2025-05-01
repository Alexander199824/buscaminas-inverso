/**
 * Implementación mejorada de lógica de buscaminas con análisis global, memoria y exploración en capas
 * Esta versión integra un sistema de memoria que permite al sistema aprender de partidas anteriores
 */


import { evaluarCeldaConMemoria, determinarMejorSegundoMovimiento } from './MemoriaJuego';
import { registrarDerrota } from './historialDerrotas';

/**
 * Obtener todas las celdas adyacentes a una celda
 * @param {number} fila - Fila de la celda
 * @param {number} columna - Columna de la celda
 * @param {object} tamañoTablero - Objeto con filas y columnas del tablero
 * @returns {Array} - Array de objetos {fila, columna} de las celdas adyacentes
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
 * Determina la distancia Manhattan entre dos celdas
 * @param {number} fila1 - Fila de la primera celda
 * @param {number} columna1 - Columna de la primera celda
 * @param {number} fila2 - Fila de la segunda celda
 * @param {number} columna2 - Columna de la segunda celda
 * @returns {number} - Distancia Manhattan entre las celdas
 */
export const distanciaManhattan = (fila1, columna1, fila2, columna2) => {
    return Math.abs(fila1 - fila2) + Math.abs(columna1 - columna2);
};

/**
 * Determina la distancia de borde de una celda
 * @param {number} fila - Fila de la celda
 * @param {number} columna - Columna de la celda
 * @param {object} tamañoTablero - Tamaño del tablero
 * @returns {number} - Distancia mínima al borde (0 = borde)
 */
export const distanciaBorde = (fila, columna, tamañoTablero) => {
    return Math.min(
        fila, // Distancia al borde superior
        tamañoTablero.filas - 1 - fila, // Distancia al borde inferior
        columna, // Distancia al borde izquierdo
        tamañoTablero.columnas - 1 - columna // Distancia al borde derecho
    );
};

/**
 * Historial de selecciones para evitar repetir celdas en aleatorios
 * @type {Array<string>}
 */
let historialSeleccionesAleatorias = [];



/**
 * Seleccionar una celda para el primer movimiento considerando memoria histórica
 * @param {object} tamañoTablero - Objeto con filas y columnas del tablero
 * @param {object} memoriaJuego - Objeto de memoria del juego
 * @returns {object} - Celda seleccionada {fila, columna}
 */
export const seleccionarPrimeraCeldaSegura = (tamañoTablero, memoriaJuego = null) => {
    // Validar que tamañoTablero sea un objeto válido
    if (!tamañoTablero || typeof tamañoTablero !== 'object' || !tamañoTablero.filas || !tamañoTablero.columnas) {
        console.error("Error: tamañoTablero no es válido", tamañoTablero);
        return { fila: 0, columna: 0 }; // Valor por defecto en caso de error
    }
    
    const { filas, columnas } = tamañoTablero;
    
    console.log(`===== SELECCIÓN DE PRIMER MOVIMIENTO =====`);
    console.log(`Tablero: ${filas}x${columnas}`);
    
    // Control de historial para prevenir errores
    if (!historialSeleccionesAleatorias) {
        historialSeleccionesAleatorias = [];
    }
    
    // Reiniciar historial si se cambia el tamaño del tablero
    if (historialSeleccionesAleatorias.length > 0) {
        try {
            const primeraSeleccion = historialSeleccionesAleatorias[0].split(',');
            if (primeraSeleccion && primeraSeleccion.length >= 1) {
                const filaHistorial = parseInt(primeraSeleccion[0]);
                
                // Si la fila está fuera del rango del nuevo tablero, reiniciar historial
                if (filaHistorial >= filas) {
                    historialSeleccionesAleatorias = [];
                    console.log(`Historial de selecciones reiniciado por cambio de tamaño de tablero`);
                }
            } else {
                // Historial malformado, reiniciarlo
                historialSeleccionesAleatorias = [];
            }
        } catch (error) {
            console.error("Error al procesar historial de selecciones:", error);
            historialSeleccionesAleatorias = [];
        }
    }
    
    // Limitar el historial para no almacenar demasiadas entradas
    if (historialSeleccionesAleatorias.length > 15) {
        historialSeleccionesAleatorias = historialSeleccionesAleatorias.slice(-15);
    }
    
    // Lista de todas las posibles ubicaciones con su evaluación
    const todasLasUbicaciones = [];
    
    // Obtener minas conocidas del historial (si existe memoria)
    const minasConocidas = [];
    if (memoriaJuego && memoriaJuego.mapaCalorMinas) {
        // Convertir coordenadas normalizadas a coordenadas reales de tablero
        for (const claveNorm in memoriaJuego.mapaCalorMinas) {
            try {
                const [filaNorm, columnaNorm] = claveNorm.split(',').map(parseFloat);
                
                // Denormalizar para el tamaño actual del tablero
                const fila = Math.round(filaNorm * (filas - 1));
                const columna = Math.round(columnaNorm * (columnas - 1));
                
                // Solo considerar coordenadas válidas para este tablero
                if (fila >= 0 && fila < filas && columna >= 0 && columna < columnas) {
                    minasConocidas.push({ fila, columna });
                    console.log(`MEMORIA: Mina conocida en (${fila + 1}, ${columna + 1})`);
                }
            } catch (error) {
                console.error("Error al procesar mina conocida:", claveNorm, error);
            }
        }
    }
    
    console.log(`Total de minas conocidas: ${minasConocidas.length}`);
    
    // Evaluar todas las celdas
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            // Crear clave para la celda
            const clave = `${i},${j}`;
            
            // Si ya está en el historial reciente, saltarla
            if (historialSeleccionesAleatorias.includes(clave)) {
                continue;
            }
            
            // IMPORTANTE: Si esta celda es una mina conocida, NO considerarla
            if (minasConocidas.some(mina => mina.fila === i && mina.columna === j)) {
                continue;
            }
            
            // Calcular valor base según posición (favoreciendo esquinas y bordes)
            const distBorde = distanciaBorde(i, j, tamañoTablero);
            let valorPosicion = 1.0;
            
            // Esquinas (tienen solo 3 adyacentes)
            if ((i === 0 || i === filas - 1) && (j === 0 || j === columnas - 1)) {
                valorPosicion = 1.3; // Prioridad alta para esquinas
            } 
            // Bordes (tienen solo 5 adyacentes)
            else if (i === 0 || i === filas - 1 || j === 0 || j === columnas - 1) {
                valorPosicion = 1.2; // Prioridad media-alta para bordes
            }
            // Favorece algo las celdas cerca de bordes pero no en los bordes
            else if (distBorde === 1) {
                valorPosicion = 1.1;
            }
            // Las celdas centrales tienen menor prioridad base
            else {
                // Menos prioridad a mayor distancia del borde
                valorPosicion = 1.0 - (distBorde / Math.max(filas, columnas)) * 0.3;
            }
            
            // Aplicar factor de memoria si existe
            let factorRiesgo = 0;
            let razonamiento = ["Estrategia posicional"];
            let confianza = "media";
            
            if (memoriaJuego) {
                try {
                    const evaluacion = evaluarCeldaConMemoria(
                        memoriaJuego, i, j, tamañoTablero, []
                    );
                    
                    if (evaluacion) {
                        factorRiesgo = evaluacion.factorRiesgo || 0;
                        if (evaluacion.razonamiento) {
                            razonamiento = [...razonamiento, ...evaluacion.razonamiento];
                        }
                        confianza = evaluacion.confianza || "media";
                    }
                } catch (error) {
                    console.error("Error al evaluar celda con memoria:", error);
                    // Si hay un error en la evaluación, usar valores predeterminados
                }
            }
            
            // Aumentar significativamente el factor de riesgo para celdas cercanas a minas conocidas
            if (minasConocidas.length > 0) {
                for (const mina of minasConocidas) {
                    const distancia = Math.abs(mina.fila - i) + Math.abs(mina.columna - j);
                    
                    // Si está muy cerca de una mina conocida, aumentar el riesgo
                    if (distancia <= 2) {
                        const factorCercania = Math.max(0, 0.5 - (distancia * 0.2));
                        factorRiesgo += factorCercania;
                        razonamiento.push(`Cerca de mina conocida (${mina.fila + 1},${mina.columna + 1})`);
                    }
                }
            }
            
            // El valor final es inverso al riesgo (más riesgo = menos valor)
            const valorFinal = valorPosicion * (1 - factorRiesgo * 0.8);
            
            todasLasUbicaciones.push({
                fila: i,
                columna: j,
                valor: valorFinal,
                factorRiesgo,
                razonamiento,
                confianza
            });
        }
    }
    
    // Si no hay ubicaciones disponibles (raro), permitir reutilizar
    if (todasLasUbicaciones.length === 0) {
        console.warn("No hay ubicaciones disponibles, reciclando...");
        // Reiniciar historial y volver a intentar sin restricciones
        historialSeleccionesAleatorias = [];
        return seleccionarPrimeraCeldaSegura(tamañoTablero, memoriaJuego);
    }
    
    // Ordenar por valor (mayor primero)
    todasLasUbicaciones.sort((a, b) => b.valor - a.valor);
    
    // Log de las mejores opciones para depuración
    console.log("Mejores opciones:");
    todasLasUbicaciones.slice(0, 3).forEach((opcion, idx) => {
        console.log(`${idx+1}. (${opcion.fila + 1},${opcion.columna + 1}) - Valor: ${opcion.valor.toFixed(1)}, Riesgo: ${Math.round(opcion.factorRiesgo * 100)}%`);
    });
    
    // Agregar algo de aleatoriedad: seleccionar entre el top 20% de opciones
    const topOpciones = Math.max(1, Math.ceil(todasLasUbicaciones.length * 0.2));
    const indiceAleatorio = Math.floor(Math.random() * topOpciones);
    
    const seleccion = todasLasUbicaciones[indiceAleatorio];
    console.log(`SELECCIONADA: Celda (${seleccion.fila + 1},${seleccion.columna + 1}) - Valor: ${seleccion.valor.toFixed(1)}, Riesgo: ${Math.round(seleccion.factorRiesgo * 100)}%`);
    
    // Agregar al historial
    historialSeleccionesAleatorias.push(`${seleccion.fila},${seleccion.columna}`);
    console.log(`===== FIN DE SELECCIÓN DE PRIMER MOVIMIENTO =====`);
    
    return seleccion;
};

/**
 * Analizar el tablero para tomar decisiones estratégicas (versión mejorada con capas)
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
    setAnimacion,
    memoriaJuego = null
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
        // Obtener último movimiento para contexto
        let ultimoMovimiento = null;
        if (historialMovimientos && historialMovimientos.length > 0) {
            ultimoMovimiento = historialMovimientos[historialMovimientos.length - 1];
            console.log("CONTEXTO: Analizando después de la última acción:");
            if (!ultimoMovimiento.esAccion) {
                console.log(`- Celda (${ultimoMovimiento.fila + 1},${ultimoMovimiento.columna + 1}) = ${ultimoMovimiento.contenido === 'mina' ? '💣 MINA' : ultimoMovimiento.contenido === 'vacío' ? 'VACÍO' : ultimoMovimiento.contenido}`);
            } else {
                console.log(`- 🚩 Bandera en (${ultimoMovimiento.fila + 1},${ultimoMovimiento.columna + 1})`);
            }
        }
        
        // 1. CREAR MODELO COMPLETO DEL TABLERO
        const modeloTablero = crearModeloTablero(tablero, tamañoTablero, celdasDescubiertas, banderas);
        
        // 2. IDENTIFICAR TODAS LAS BANDERAS NUEVAS
        console.log("PASO 1: Identificando banderas");
        const nuevasBanderas = identificarTodasLasBanderas(modeloTablero);
        
        if (nuevasBanderas.length > 0) {
            console.log(`- Encontradas ${nuevasBanderas.length} nuevas banderas`);
            nuevasBanderas.forEach((bandera, idx) => {
                console.log(`  • Bandera en (${bandera.fila + 1}, ${bandera.columna + 1}) - ${bandera.origen}`);
            });
        } else {
            console.log("- No se identificaron nuevas banderas");
        }
        
        // 3. IDENTIFICAR CELDAS 100% SEGURAS
        console.log("PASO 2: Identificando celdas seguras");
        const celdasSeguras = identificarCeldasSeguras(modeloTablero);
        
        if (celdasSeguras.length > 0) {
            console.log(`- Encontradas ${celdasSeguras.length} celdas 100% seguras`);
            celdasSeguras.forEach((celda, idx) => {
                console.log(`  • Celda segura en (${celda.fila + 1}, ${celda.columna + 1}) - ${celda.origen}`);
            });
        } else {
            console.log("- No se identificaron celdas 100% seguras");
        }
        
        // 4. CALCULAR PROBABILIDADES PARA TODAS LAS CELDAS
        console.log("PASO 3: Calculando probabilidades");
        const mapaProbabilidades = calcularProbabilidadesGlobales(modeloTablero);
        
        // 5. Enriquecer el mapa de probabilidades con la memoria histórica
        console.log("PASO 4: Aplicando memoria histórica");
        const mapaProbabilidadesEnriquecido = enriquecerMapaProbabilidades(
            mapaProbabilidades, 
            memoriaJuego, 
            tamañoTablero, 
            historialMovimientos,
            modeloTablero
        );
        
        // 6. Determinar si estamos en el segundo movimiento para usar la memoria
        let siguienteCelda = null;
        const movimientosReales = historialMovimientos.filter(mov => !mov.esAccion);
        
        // CASO ESPECIAL: Si es el segundo movimiento, usar la memoria si está disponible
        if (movimientosReales.length === 1 && memoriaJuego && celdasSeguras.length === 0) {
            console.log("PASO 5: Evaluando segundo movimiento con memoria histórica");
            const mejorSegundoMovimiento = determinarMejorSegundoMovimiento(
                memoriaJuego, 
                movimientosReales[0], 
                tamañoTablero
            );
            
            if (mejorSegundoMovimiento && mejorSegundoMovimiento.confianza === 'alta') {
                // Verificar que la celda sea válida (no descubierta, sin bandera)
                const esValida = !celdasDescubiertas.some(c => 
                    c.fila === mejorSegundoMovimiento.fila && c.columna === mejorSegundoMovimiento.columna
                ) && !banderas.some(b => 
                    b.fila === mejorSegundoMovimiento.fila && b.columna === mejorSegundoMovimiento.columna
                );
                
                if (esValida) {
                    siguienteCelda = {
                        fila: mejorSegundoMovimiento.fila,
                        columna: mejorSegundoMovimiento.columna,
                        tipoAnalisis: `memoria histórica (${Math.round(mejorSegundoMovimiento.tasaExito * 100)}% éxito)`,
                        origen: 'aprendizaje de partidas anteriores',
                        explicacion: `Seleccionada basada en memoria histórica con ${Math.round(mejorSegundoMovimiento.tasaExito * 100)}% de tasa de éxito en jugadas previas`
                    };
                    
                    console.log(`DECISIÓN: Segundo movimiento optimizado por memoria histórica`);
                    console.log(`- Celda (${siguienteCelda.fila + 1}, ${siguienteCelda.columna + 1}) con tasa de éxito del ${Math.round(mejorSegundoMovimiento.tasaExito * 100)}%`);
                }
            } else {
                console.log("- No se encontró un segundo movimiento óptimo en la memoria");
            }
        }
        
        // 7. Si no hay una celda determinada por memoria, usar el análisis normal
        if (!siguienteCelda) {
            console.log("PASO 6: Determinando mejor jugada por análisis en capas");
            siguienteCelda = determinarMejorJugadaEnCapas(
                modeloTablero, 
                mapaProbabilidadesEnriquecido, 
                celdasSeguras, 
                historialMovimientos,
                memoriaJuego,
                tamañoTablero
            );
            
            // Loguear la decisión
            if (siguienteCelda) {
                console.log(`DECISIÓN FINAL: Celda (${siguienteCelda.fila + 1}, ${siguienteCelda.columna + 1})`);
                console.log(`- Tipo: ${siguienteCelda.tipoAnalisis}`);
                console.log(`- Razón: ${siguienteCelda.explicacion}`);
            }
        }
        
        // 8. GENERAR MOVIMIENTOS PARA NUEVAS BANDERAS
        const movimientosGenerados = nuevasBanderas.map(bandera => ({
            fila: bandera.fila,
            columna: bandera.columna,
            esAccion: true,
            accion: "bandera",
            origen: bandera.origen,
            explicacion: bandera.detalle || `Bandera identificada mediante ${bandera.origen}`
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
            const mensaje = `Seleccionando la casilla (${siguienteCelda.fila + 1},${siguienteCelda.columna + 1}) - ${tipoAnalisis}`;
            setMensajeSistema(mensaje);
        }
        
        return {
            banderas: [...banderas, ...nuevasBanderas],
            siguienteCelda,
            movimientosGenerados,
            mapaProbabilidades: mapaProbabilidadesEnriquecido
        };
    } catch (error) {
        console.error("Error al analizar tablero:", error);
        // En caso de error, seleccionar una celda aleatoria para no bloquear el juego
        const celdaAleatoria = seleccionarCeldaAleatoria(tablero, tamañoTablero, celdasDescubiertas, banderas, memoriaJuego, historialMovimientos);
        console.log("ERROR en análisis, seleccionando celda aleatoria:", celdaAleatoria);
        return {
            banderas: banderas || [],
            siguienteCelda: celdaAleatoria,
            movimientosGenerados: []
        };
    }
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
        
        // Solo procesar celdas con números (incluyendo el '0')
        if (valor !== null && valor !== undefined && ((!isNaN(valor) && valor !== '') || valor === '0') && valor !== 'M') {
            const numeroMinas = parseInt(valor === '' ? '0' : valor);
            
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
 * Identifica todas las banderas que se pueden colocar con certeza, mejorado para evitar contradicciones
 * @param {object} modeloTablero - Modelo completo del tablero
 * @returns {Array} - Lista de nuevas banderas a colocar
 */
const identificarTodasLasBanderas = (modeloTablero) => {
    const { restricciones, estadoCeldas, banderas, tamañoTablero } = modeloTablero;
    const nuevasBanderas = [];
    
    console.log("===== ANÁLISIS DETALLADO DE BANDERAS =====");
    
    // 1. ANÁLISIS SIMPLE: Si una restricción tiene exactamente tantas celdas sin descubrir
    // como minas faltantes, todas esas celdas son minas
    console.log("PASO 1: Análisis simple de restricciones");
    restricciones.forEach((restriccion, index) => {
        const { celda, valor, celdasAfectadas, banderasColocadas } = restriccion;
        const minasFaltantes = valor - banderasColocadas;
        
        console.log(`\nAnalizando celda (${celda.fila + 1},${celda.columna + 1}) con valor ${valor}:`);
        console.log(`- Banderas colocadas: ${banderasColocadas}`);
        console.log(`- Minas faltantes: ${minasFaltantes}`);
        
        // Filtrar celdas sin descubrir y sin bandera
        const celdasSinDescubrirSinBandera = celdasAfectadas.filter(c => 
            !estadoCeldas[c.fila][c.columna].descubierta && 
            !estadoCeldas[c.fila][c.columna].tieneBandera &&
            !banderas.some(b => b.fila === c.fila && b.columna === c.columna) &&
            !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)
        );
        
        console.log(`- Celdas sin descubrir/sin bandera: ${celdasSinDescubrirSinBandera.length}`);
        
        // Verificar valor de celdas adyacentes para prevenir contradicciones
        // MEJORA: Verificar celdas con valor 0 adyacentes (no pueden tener minas)
        const hayContradiccionConCeros = celdasSinDescubrirSinBandera.some(c => {
            const adyacentes = obtenerCeldasAdyacentes(c.fila, c.columna, tamañoTablero);
            // Si alguna celda adyacente tiene valor 0, esta celda no puede ser mina
            return adyacentes.some(adj => 
                estadoCeldas[adj.fila][adj.columna].descubierta && 
                (estadoCeldas[adj.fila][adj.columna].valor === '0' || 
                 estadoCeldas[adj.fila][adj.columna].valor === '')
            );
        });
        
        if (hayContradiccionConCeros) {
            console.log(`⚠️ CONTRADICCIÓN CON CEROS: Algunas celdas candidatas están adyacentes a celdas con valor 0`);
            console.log(`⛔ Omitiendo banderas por contradicción con ceros`);
            return; // Pasar a la siguiente restricción
        }
        
        // Si el número de celdas sin descubrir es igual a las minas faltantes,
        // todas son minas (y podemos colocar banderas)
        if (celdasSinDescubrirSinBandera.length === minasFaltantes && minasFaltantes > 0) {
            console.log(`🚩 ¡COINCIDENCIA EXACTA! Todas las celdas sin descubrir son minas`);
            
            // MEJORA: Verificar contradicciones con el conjunto completo de restricciones
            const verificacionConjunta = verificarConjuntoRestricciones(
                celdasSinDescubrirSinBandera, 
                restriccion, 
                restricciones, 
                estadoCeldas,
                tamañoTablero
            );
            
            if (verificacionConjunta.hayContradiccion) {
                console.log(`⚠️ CONTRADICCIÓN GLOBAL DETECTADA: ${verificacionConjunta.mensaje}`);
                console.log(`⛔ Omitiendo banderas debido a contradicciones globales`);
            } else {
                celdasSinDescubrirSinBandera.forEach(c => {
                    if (!nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                        // MEJORA: Verificación adicional de todas las restricciones afectadas
                        const restriccionesAfectadas = obtenerTodasRestriccionesAfectadas(c, restriccion, restricciones);
                        console.log(`- Celda (${c.fila + 1},${c.columna + 1}) afecta a ${restriccionesAfectadas.length} restricciones adicionales`);
                        
                        const razonesDetalladas = [];
                        let esSeguro = true;
                        
                        // Analizar cada restricción afectada
                        restriccionesAfectadas.forEach(r => {
                            const validacion = validarBanderaConRestriccion(c, r, estadoCeldas, nuevasBanderas);
                            if (!validacion.esValido) {
                                esSeguro = false;
                                razonesDetalladas.push(validacion.razon);
                            }
                        });
                        
                        if (esSeguro) {
                            console.log(`✅ Colocando bandera en (${c.fila + 1},${c.columna + 1})`);
                            nuevasBanderas.push({
                                fila: c.fila,
                                columna: c.columna,
                                origen: 'análisis simple',
                                celdaOrigen: celda,
                                detalle: `La celda (${celda.fila + 1},${celda.columna + 1}) con valor ${valor} necesita exactamente ${minasFaltantes} minas y hay ${celdasSinDescubrirSinBandera.length} celdas sin descubrir.`,
                                restriccionesAfectadas: restriccionesAfectadas.map(r => `(${r.celda.fila + 1},${r.celda.columna + 1})=${r.valor}`)
                            });
                            
                            // Actualizar modelo para próximas comprobaciones
                            estadoCeldas[c.fila][c.columna].tieneBandera = true;
                            estadoCeldas[c.fila][c.columna].probabilidadMina = 1;
                        } else {
                            console.log(`⚠️ No se puede colocar bandera en (${c.fila + 1},${c.columna + 1}) por contradicciones:`);
                            razonesDetalladas.forEach(razon => console.log(`  - ${razon}`));
                        }
                    }
                });
            }
        } else if (celdasSinDescubrirSinBandera.length < minasFaltantes) {
            console.log(`⚠️ POSIBLE ERROR: Faltan celdas para colocar todas las minas necesarias`);
        } else {
            console.log(`ℹ️ No hay información suficiente para determinar banderas con este análisis (${celdasSinDescubrirSinBandera.length} celdas, ${minasFaltantes} minas requeridas)`);
        }
    });
    
    // 2. ANÁLISIS DE SUBCONJUNTOS - Con validación mejorada
    console.log("\nPASO 2: Análisis de subconjuntos");
    const nuevasBanderasSubconjuntos = analizarSubconjuntos(modeloTablero, nuevasBanderas);
    
    if (nuevasBanderasSubconjuntos.length > 0) {
        console.log(`- Encontradas ${nuevasBanderasSubconjuntos.length} banderas adicionales por análisis de subconjuntos`);
    } else {
        console.log(`- No se encontraron banderas adicionales por análisis de subconjuntos`);
    }
    
    nuevasBanderasSubconjuntos.forEach(bandera => {
        if (!nuevasBanderas.some(b => b.fila === bandera.fila && b.columna === bandera.columna)) {
            console.log(`✅ Colocando bandera en (${bandera.fila + 1},${bandera.columna + 1}) por análisis de subconjuntos`);
            nuevasBanderas.push(bandera);
            // Actualizar modelo
            estadoCeldas[bandera.fila][bandera.columna].tieneBandera = true;
            estadoCeldas[bandera.fila][bandera.columna].probabilidadMina = 1;
        }
    });
    
    // 3. ANÁLISIS DE PATRONES ESPECÍFICOS
    // Buscar patrones como 1-2-1, etc.
    console.log("\nPASO 3: Análisis de patrones específicos");
    const nuevasBanderasPatrones = detectarPatronesParaBanderas(modeloTablero, nuevasBanderas);
    
    if (nuevasBanderasPatrones.length > 0) {
        console.log(`- Encontradas ${nuevasBanderasPatrones.length} banderas adicionales por análisis de patrones`);
    } else {
        console.log(`- No se encontraron banderas adicionales por análisis de patrones`);
    }
    
    nuevasBanderasPatrones.forEach(bandera => {
        if (!nuevasBanderas.some(b => b.fila === bandera.fila && b.columna === bandera.columna)) {
            console.log(`✅ Colocando bandera en (${bandera.fila + 1},${bandera.columna + 1}) por análisis de patrones`);
            nuevasBanderas.push(bandera);
            // Actualizar modelo
            estadoCeldas[bandera.fila][bandera.columna].tieneBandera = true;
            estadoCeldas[bandera.fila][bandera.columna].probabilidadMina = 1;
        }
    });
    
    console.log(`\nRESULTADO FINAL: ${nuevasBanderas.length} banderas identificadas`);
    nuevasBanderas.forEach((bandera, i) => {
        console.log(`${i+1}. Bandera en (${bandera.fila + 1},${bandera.columna + 1}) - ${bandera.origen}`);
        if (bandera.restriccionesAfectadas) {
            console.log(`   Afecta a restricciones: ${bandera.restriccionesAfectadas.join(', ')}`);
        }
    });
    console.log("===== FIN DE ANÁLISIS DE BANDERAS =====");
    
    return nuevasBanderas;
};

/**
 * Verifica si colocar una bandera en una celda contradice otras restricciones
 * @param {object} celda - Celda donde se quiere colocar bandera {fila, columna}
 * @param {object} restriccionActual - Restricción que sugiere colocar la bandera
 * @param {Array} todasRestricciones - Todas las restricciones del tablero
 * @param {Array} estadoCeldas - Estado actual de todas las celdas
 * @returns {boolean} - true si hay contradicción
 */
const verificarContradiccionConOtrasRestricciones = (celda, restriccionActual, todasRestricciones, estadoCeldas) => {
    // Obtener todas las restricciones que afectan a esta celda (excepto la actual)
    const restriccionesAfectadas = todasRestricciones.filter(r => 
        (r.celda.fila !== restriccionActual.celda.fila || r.celda.columna !== restriccionActual.celda.columna) &&
        r.celdasAfectadas.some(c => c.fila === celda.fila && c.columna === celda.columna)
    );
    
    // Si no hay otras restricciones, no hay contradicción
    if (restriccionesAfectadas.length === 0) {
        console.log(`  ℹ️ La celda (${celda.fila + 1},${celda.columna + 1}) no está afectada por otras restricciones`);
        return false;
    }
    
    console.log(`  🔍 Verificando ${restriccionesAfectadas.length} restricciones adicionales que afectan a (${celda.fila + 1},${celda.columna + 1})`);
    
    // Verificar cada restricción afectada
    for (const restriccion of restriccionesAfectadas) {
        const { valor, banderasColocadas, celdasAfectadas } = restriccion;
        const minasFaltantes = valor - banderasColocadas;
        
        // MEJORA: Verificar especialmente celdas con valor 0
        if (valor === 0) {
            console.log(`  ⛔ CONTRADICCIÓN CRÍTICA: La celda (${restriccion.celda.fila + 1},${restriccion.celda.columna + 1}) tiene valor 0, no puede tener minas adyacentes`);
            return true;
        }
        
        // Contar cuántas celdas sin descubrir quedan en esta restricción (excluyendo la celda actual)
        const celdasSinDescubrirRestantes = celdasAfectadas.filter(c => 
            !estadoCeldas[c.fila][c.columna].descubierta && 
            !estadoCeldas[c.fila][c.columna].tieneBandera &&
            (c.fila !== celda.fila || c.columna !== celda.columna)
        );
        
        console.log(`  • Restricción (${restriccion.celda.fila + 1},${restriccion.celda.columna + 1}) valor ${valor}:`);
        console.log(`    - Minas faltantes: ${minasFaltantes}`);
        console.log(`    - Celdas sin descubrir restantes (excluyendo candidata): ${celdasSinDescubrirRestantes.length}`);
        
        // Si al colocar esta bandera quedan más minas faltantes que celdas disponibles, hay contradicción
        if (minasFaltantes - 1 > celdasSinDescubrirRestantes.length) {
            console.log(`    ⛔ CONTRADICCIÓN: Quedarían ${minasFaltantes - 1} minas por colocar pero solo hay ${celdasSinDescubrirRestantes.length} celdas disponibles`);
            return true;
        }
        
        // Si esta restricción indica que no debería haber más minas (ya tiene todas las que necesita)
        if (minasFaltantes === 0) {
            console.log(`    ⛔ CONTRADICCIÓN: Esta restricción ya tiene todas sus minas`);
            return true;
        }
        
        // MEJORA: Verificar si esta restricción compartiría demasiadas celdas con otra restricción
        // creando un escenario imposible
        for (const otraRestriccion of todasRestricciones) {
            if (otraRestriccion.celda.fila === restriccion.celda.fila && 
                otraRestriccion.celda.columna === restriccion.celda.columna) continue;
            
            if (otraRestriccion.celda.fila === restriccionActual.celda.fila && 
                otraRestriccion.celda.columna === restriccionActual.celda.columna) continue;
            
            // Buscar celdas comunes entre estas dos restricciones
            const celdasComunes = celdasSinDescubrirRestantes.filter(cr => 
                otraRestriccion.celdasAfectadas.some(co => 
                    co.fila === cr.fila && co.columna === cr.columna &&
                    !estadoCeldas[co.fila][co.columna].descubierta &&
                    !estadoCeldas[co.fila][co.columna].tieneBandera
                )
            );
            
            if (celdasComunes.length > 0) {
                const minasFaltantesOtra = otraRestriccion.valor - otraRestriccion.banderasColocadas;
                
                // Si esta restricción y la otra ambas necesitan minas, pero comparten todas las celdas
                // disponibles y sus valores son incompatibles, hay contradicción
                const celdasTotalesOtra = otraRestriccion.celdasAfectadas.filter(c => 
                    !estadoCeldas[c.fila][c.columna].descubierta && 
                    !estadoCeldas[c.fila][c.columna].tieneBandera &&
                    (c.fila !== celda.fila || c.columna !== celda.columna)
                ).length;
                
                if (celdasComunes.length === celdasSinDescubrirRestantes.length && 
                    celdasComunes.length === celdasTotalesOtra) {
                    
                    // Si las restricciones requieren diferentes números de minas para las mismas celdas
                    if (minasFaltantes - 1 !== minasFaltantesOtra) {
                        console.log(`    ⛔ CONTRADICCIÓN COMPLEJA: La restricción (${restriccion.celda.fila + 1},${restriccion.celda.columna + 1}) necesitaría ${minasFaltantes - 1} minas en las mismas ${celdasComunes.length} celdas donde la restricción (${otraRestriccion.celda.fila + 1},${otraRestriccion.celda.columna + 1}) necesita ${minasFaltantesOtra}`);
                        return true;
                    }
                }
            }
        }
    }
    
    console.log(`  ✅ No se encontraron contradicciones con otras restricciones`);
    return false;
};

/**
 * Evalúa si una configuración de banderas es consistente con todas las restricciones
 * @param {Array} celdasCandidatas - Celdas candidatas a tener bandera
 * @param {Object} restriccionActual - Restricción actual que sugiere las banderas
 * @param {Array} todasRestricciones - Todas las restricciones del tablero
 * @param {Array} estadoCeldas - Estado actual de las celdas
 * @param {Object} tamañoTablero - Tamaño del tablero
 * @returns {Object} - Resultado de la verificación
 */
const verificarConjuntoRestricciones = (celdasCandidatas, restriccionActual, todasRestricciones, estadoCeldas, tamañoTablero) => {
    console.log(`Verificando consistencia global para ${celdasCandidatas.length} banderas candidatas...`);
    
    // Crear una copia del estado para simular la colocación de banderas
    const estadoSimulado = JSON.parse(JSON.stringify(estadoCeldas));
    
    // Simular colocación de banderas
    celdasCandidatas.forEach(c => {
        estadoSimulado[c.fila][c.columna].tieneBandera = true;
    });
    
    // Verificar cada restricción
    for (const restriccion of todasRestricciones) {
        if (restriccion.celda.fila === restriccionActual.celda.fila && 
            restriccion.celda.columna === restriccionActual.celda.columna) {
            continue; // Saltar la restricción actual
        }
        
        // Contar banderas simuladas en esta restricción
        let banderasSimuladas = 0;
        let celdasSinDescubrir = 0;
        
        restriccion.celdasAfectadas.forEach(c => {
            if (estadoSimulado[c.fila][c.columna].tieneBandera) {
                banderasSimuladas++;
            } else if (!estadoSimulado[c.fila][c.columna].descubierta) {
                celdasSinDescubrir++;
            }
        });
        
        // Verificar si se excede el número de minas
        if (banderasSimuladas > restriccion.valor) {
            return {
                hayContradiccion: true,
                mensaje: `La celda (${restriccion.celda.fila + 1},${restriccion.celda.columna + 1}) con valor ${restriccion.valor} tendría más banderas (${banderasSimuladas}) que su valor`
            };
        }
        
        // Verificar si faltan celdas para colocar minas
        if (banderasSimuladas + celdasSinDescubrir < restriccion.valor) {
            return {
                hayContradiccion: true,
                mensaje: `La celda (${restriccion.celda.fila + 1},${restriccion.celda.columna + 1}) con valor ${restriccion.valor} necesita ${restriccion.valor} minas pero solo tendría ${banderasSimuladas + celdasSinDescubrir} posibilidades`
            };
        }
        
        // Verificar celdas con valor 0 (nunca pueden tener minas adyacentes)
        if (restriccion.valor === 0) {
            const hayMinaCercaDeCero = restriccion.celdasAfectadas.some(c =>
                celdasCandidatas.some(candidata => 
                    candidata.fila === c.fila && candidata.columna === c.columna
                )
            );
            
            if (hayMinaCercaDeCero) {
                return {
                    hayContradiccion: true,
                    mensaje: `Hay banderas propuestas adyacentes a una celda con valor 0 en (${restriccion.celda.fila + 1},${restriccion.celda.columna + 1})`
                };
            }
        }
    }
    
    // Verificar celdas adyacentes a ceros (mejora específica)
    for (let i = 0; i < tamañoTablero.filas; i++) {
        for (let j = 0; j < tamañoTablero.columnas; j++) {
            if (estadoSimulado[i][j].descubierta && 
                (estadoSimulado[i][j].valor === '0' || estadoSimulado[i][j].valor === '')) {
                
                const adyacentes = obtenerCeldasAdyacentes(i, j, tamañoTablero);
                
                // Verificar si alguna celda adyacente al cero tiene bandera simulada
                const hayBanderaCercaDeCero = adyacentes.some(adj =>
                    celdasCandidatas.some(candidata => 
                        candidata.fila === adj.fila && candidata.columna === adj.columna
                    )
                );
                
                if (hayBanderaCercaDeCero) {
                    return {
                        hayContradiccion: true,
                        mensaje: `Hay banderas propuestas adyacentes a una celda con valor 0 en (${i + 1},${j + 1})`
                    };
                }
            }
        }
    }
    
    return { hayContradiccion: false };
};

/**
 * Obtiene todas las restricciones que afectan a una celda específica
 * @param {Object} celda - Celda a evaluar
 * @param {Object} restriccionActual - Restricción actual (para excluirla)
 * @param {Array} todasRestricciones - Todas las restricciones del tablero
 * @returns {Array} - Restricciones que afectan a la celda
 */
const obtenerTodasRestriccionesAfectadas = (celda, restriccionActual, todasRestricciones) => {
    return todasRestricciones.filter(r => 
        // Excluir la restricción actual
        (r.celda.fila !== restriccionActual.celda.fila || r.celda.columna !== restriccionActual.celda.columna) &&
        // Incluir solo restricciones que afectan a esta celda
        r.celdasAfectadas.some(c => c.fila === celda.fila && c.columna === celda.columna)
    );
};

/**
 * Valida si una bandera es consistente con una restricción específica
 * @param {Object} celda - Celda candidata a bandera
 * @param {Object} restriccion - Restricción a validar
 * @param {Array} estadoCeldas - Estado de las celdas
 * @param {Array} nuevasBanderas - Banderas ya identificadas
 * @returns {Object} - Resultado de la validación
 */
const validarBanderaConRestriccion = (celda, restriccion, estadoCeldas, nuevasBanderas) => {
    const { valor, celdasAfectadas } = restriccion;
    
    // Contar banderas actuales + nuevas
    let banderasActuales = 0;
    celdasAfectadas.forEach(c => {
        if (estadoCeldas[c.fila][c.columna].tieneBandera || 
            nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
            banderasActuales++;
        }
    });
    
    // Si ya hay suficientes banderas, no se puede añadir otra
    if (banderasActuales >= valor) {
        return {
            esValido: false,
            razon: `La restricción en (${restriccion.celda.fila + 1},${restriccion.celda.columna + 1}) ya tiene ${banderasActuales} banderas de ${valor}`
        };
    }
    
    // Si es una celda con valor 0, nunca puede tener minas adyacentes
    if (valor === 0) {
        return {
            esValido: false,
            razon: `La restricción en (${restriccion.celda.fila + 1},${restriccion.celda.columna + 1}) tiene valor 0, no puede tener minas adyacentes`
        };
    }
    
    // Contar celdas sin descubrir restantes (excluyendo la actual y otras nuevas banderas)
    const celdasSinDescubrirRestantes = celdasAfectadas.filter(c => 
        !estadoCeldas[c.fila][c.columna].descubierta && 
        !estadoCeldas[c.fila][c.columna].tieneBandera &&
        (c.fila !== celda.fila || c.columna !== celda.columna) &&
        !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)
    ).length;
    
    // Verificar que queden suficientes celdas para las minas restantes
    const minasFaltantesDespuesDeEsta = valor - (banderasActuales + 1);
    if (minasFaltantesDespuesDeEsta > celdasSinDescubrirRestantes) {
        return {
            esValido: false,
            razon: `Al colocar esta bandera, la restricción en (${restriccion.celda.fila + 1},${restriccion.celda.columna + 1}) necesitaría ${minasFaltantesDespuesDeEsta} minas más pero solo quedan ${celdasSinDescubrirRestantes} celdas`
        };
    }
    
    return { esValido: true };
};


/**
 * Encuentra celdas seguras con 100% de certeza
 * Mejorado para identificar automáticamente celdas adyacentes a ceros
 * @param {object} modeloTablero - Modelo completo del tablero
 * @returns {Array} - Lista de celdas seguras
 */
export const identificarCeldasSeguras = (modeloTablero) => {
    const { restricciones, estadoCeldas, banderas, tamañoTablero } = modeloTablero;
    const celdasSeguras = [];
    
    // VERIFICACIÓN PARA CELDAS ADYACENTES A CEROS
    // Esto es crítico porque las celdas adyacentes a un cero son siempre seguras
    for (let i = 0; i < tamañoTablero.filas; i++) {
        for (let j = 0; j < tamañoTablero.columnas; j++) {
            // Si la celda está descubierta y es un 0 (o vacío)
            if (estadoCeldas[i][j].descubierta && 
                (estadoCeldas[i][j].valor === '0' || estadoCeldas[i][j].valor === '')) {
                
                // Todas las celdas adyacentes a un 0 son seguras
                const celdasAdyacentes = obtenerCeldasAdyacentes(i, j, tamañoTablero);
                
                celdasAdyacentes.forEach(c => {
                    // Verificar que no esté ya descubierta o tenga bandera
                    if (!estadoCeldas[c.fila][c.columna].descubierta && 
                        !estadoCeldas[c.fila][c.columna].tieneBandera &&
                        !celdasSeguras.some(s => s.fila === c.fila && s.columna === c.columna)) {
                        
                        celdasSeguras.push({
                            fila: c.fila,
                            columna: c.columna,
                            origen: 'adyacente a cero',
                            celdaOrigen: { fila: i, columna: j },
                            prioridad: 'alta' // Alta prioridad para propagar ceros rápidamente
                        });
                        
                        // Actualizar modelo
                        estadoCeldas[c.fila][c.columna].esSegura = true;
                        estadoCeldas[c.fila][c.columna].probabilidadMina = 0;
                    }
                });
            }
        }
    }
    
    // ANÁLISIS POR RESTRICCIONES: Si una restricción tiene todas sus minas identificadas,
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
                        celdaOrigen: celda,
                        prioridad: 'media' // Prioridad media
                    });
                    // Actualizar modelo
                    estadoCeldas[c.fila][c.columna].esSegura = true;
                    estadoCeldas[c.fila][c.columna].probabilidadMina = 0;
                }
            });
        }
    });
    
    // ANÁLISIS DE SUBCONJUNTOS: Buscar celdas seguras mediante análisis de subconjuntos
    const celdasSegurasSubconjuntos = analizarSubconjuntosParaSeguras(modeloTablero);
    
    if (celdasSegurasSubconjuntos.length > 0) {
        console.log(`- Encontradas ${celdasSegurasSubconjuntos.length} celdas seguras adicionales por análisis de subconjuntos`);
    }
    
    celdasSegurasSubconjuntos.forEach(segura => {
        if (!celdasSeguras.some(s => s.fila === segura.fila && s.columna === segura.columna)) {
            celdasSeguras.push({
                ...segura,
                prioridad: 'media' // Prioridad media
            });
            // Actualizar modelo
            estadoCeldas[segura.fila][segura.columna].esSegura = true;
            estadoCeldas[segura.fila][segura.columna].probabilidadMina = 0;
        }
    });
    
    // ANÁLISIS DE PATRONES: Buscar celdas seguras mediante patrones específicos (como 1-2-1)
    const celdasSegurasPatrones = detectarPatronesParaSeguras(modeloTablero);
    
    if (celdasSegurasPatrones.length > 0) {
        console.log(`- Encontradas ${celdasSegurasPatrones.length} celdas seguras adicionales por análisis de patrones`);
    }
    
    celdasSegurasPatrones.forEach(segura => {
        if (!celdasSeguras.some(s => s.fila === segura.fila && s.columna === s.columna)) {
            celdasSeguras.push({
                ...segura,
                prioridad: 'baja' // Prioridad baja
            });
            // Actualizar modelo
            estadoCeldas[segura.fila][segura.columna].esSegura = true;
            estadoCeldas[segura.fila][segura.columna].probabilidadMina = 0;
        }
    });
    
    // Ordenar celdas seguras por prioridad (primero las de alta prioridad)
    // Esto garantiza que exploremos primero las celdas adyacentes a ceros
    celdasSeguras.sort((a, b) => {
        const prioridadA = a.prioridad === 'alta' ? 0 : (a.prioridad === 'media' ? 1 : 2);
        const prioridadB = b.prioridad === 'alta' ? 0 : (b.prioridad === 'media' ? 1 : 2);
        return prioridadA - prioridadB;
    });
    
    return celdasSeguras;
};

/**
 * Calcula probabilidades de mina para todas las celdas sin descubrir
 * Versión mejorada para manejar todos los números del 0 al 8
 * @param {object} modeloTablero - Modelo completo del tablero
 * @returns {object} - Mapa de probabilidades para cada celda
 */
export const calcularProbabilidadesGlobales = (modeloTablero) => {
    const { estadoCeldas, restricciones, tamañoTablero } = modeloTablero;
    const { filas, columnas } = tamañoTablero;
    const mapaProbabilidades = {};
    
    // 1. Inicializar mapa con probabilidad base para todas las celdas no descubiertas
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            // Clave única para cada celda
            const clave = `${i},${j}`;
            
            // Si la celda ya está descubierta o tiene bandera, no necesitamos calcular probabilidad
            if (estadoCeldas[i][j].descubierta || estadoCeldas[i][j].tieneBandera) {
                continue;
            }
            
            // Probabilidad base conservadora más baja para favorecer exploración
            mapaProbabilidades[clave] = {
                probabilidad: 0.1,
                certeza: false,
                origen: 'valor base'
            };
        }
    }
    
    // 2. Actualizar probabilidades según restricciones locales
    restricciones.forEach(restriccion => {
        const { celda, celdasAfectadas, minasFaltantes } = restriccion;
        const valorNumerico = parseInt(estadoCeldas[celda.fila][celda.columna].valor);
        
        // Solo calcular si hay celdas afectadas y minas faltantes
        if (celdasAfectadas.length > 0 && minasFaltantes >= 0) {
            // Filtrar celdas sin descubrir y sin bandera
            const celdasRelevantes = celdasAfectadas.filter(c => 
                !estadoCeldas[c.fila][c.columna].descubierta && 
                !estadoCeldas[c.fila][c.columna].tieneBandera
            );
            
            // Si no hay celdas relevantes, saltamos
            if (celdasRelevantes.length === 0) return;
            
            // Calcular probabilidad para esta restricción
            const probabilidadRestricccion = celdasRelevantes.length > 0 ? 
                minasFaltantes / celdasRelevantes.length : 0;
            
            // MEJORADO: Factor de ajuste dinámico según el valor numérico (0-8)
            let factorAjuste = 1.0;
            
            // Los valores más altos indican mayor concentración de minas en la zona
            if (valorNumerico === 0) {
                factorAjuste = 0; // Celdas adyacentes a 0 siempre son seguras
            } else if (valorNumerico === 1) {
                factorAjuste = 1.0; // Probabilidad normal
            } else if (valorNumerico === 2) {
                factorAjuste = 1.1; // Ligero incremento
            } else if (valorNumerico === 3) {
                factorAjuste = 1.2; // Mayor incremento
            } else if (valorNumerico === 4) {
                factorAjuste = 1.3; // Incremento significativo
            } else if (valorNumerico >= 5) {
                factorAjuste = 1.4; // Incremento muy significativo
            }
            
            // Actualizar mapa de probabilidades
            celdasRelevantes.forEach(c => {
                const clave = `${c.fila},${c.columna}`;
                
                // Si valorNumerico es 0, siempre asignar probabilidad 0
                if (valorNumerico === 0) {
                    mapaProbabilidades[clave] = {
                        probabilidad: 0,
                        certeza: true,
                        origen: `adyacente a cero en (${celda.fila+1},${celda.columna+1})`
                    };
                    return;
                }
                
                // Aplicar factor de ajuste
                const probabilidadAjustada = probabilidadRestricccion * factorAjuste;
                
                // Si la celda ya tiene una probabilidad asignada, tomamos la más alta
                if (!mapaProbabilidades[clave] || mapaProbabilidades[clave].probabilidad < probabilidadAjustada) {
                    mapaProbabilidades[clave] = {
                        probabilidad: probabilidadAjustada,
                        certeza: false,
                        origen: `restricción de ${valorNumerico} en (${restriccion.celda.fila+1},${restriccion.celda.columna+1})`
                    };
                }
            });
        }
    });
    
    // 3. Ajuste adicional para celdas adyacentes a números
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            const clave = `${i},${j}`;
            
            // Si la celda no está en el mapa, continuar
            if (!mapaProbabilidades[clave]) continue;
            
            // Verificar si es adyacente a algún número > 0
            const celdasAdyacentes = obtenerCeldasAdyacentes(i, j, tamañoTablero);
            
            // Buscar el número más alto adyacente (más relevante para determinar riesgo)
            let maxValorAdyacente = 0;
            let contieneNumeroAlto = false;
            
            celdasAdyacentes.forEach(adj => {
                if (estadoCeldas[adj.fila][adj.columna].descubierta) {
                    const valorAdj = estadoCeldas[adj.fila][adj.columna].valor;
                    if (valorAdj !== '' && valorAdj !== 'M' && !isNaN(valorAdj)) {
                        const numValor = parseInt(valorAdj);
                        if (numValor > maxValorAdyacente) {
                            maxValorAdyacente = numValor;
                        }
                        
                        // Considerar números 4-8 como "altos"
                        if (numValor >= 4) {
                            contieneNumeroAlto = true;
                        }
                    }
                }
            });
            
            // Si es adyacente a un número > 0, ajustar su probabilidad
            if (maxValorAdyacente > 0) {
                // Escala de ajuste basada en el máximo valor adyacente
                let factorAjuste = 1 + (maxValorAdyacente * 0.1); // 10% por cada unidad
                
                // Bonus para números muy altos (indican alta concentración de minas)
                if (contieneNumeroAlto) {
                    factorAjuste += 0.1; // Bonus adicional
                }
                
                mapaProbabilidades[clave].probabilidad *= factorAjuste;
                mapaProbabilidades[clave].probabilidad = Math.min(0.95, mapaProbabilidades[clave].probabilidad);
                mapaProbabilidades[clave].origen += ` | adyacente a ${maxValorAdyacente}`;
            }
        }
    }
    
    // 4. Reducir probabilidades para celdas aisladas (lejos de números)
    reducirProbabilidadesCeldasAisladas(modeloTablero, mapaProbabilidades);
    
    // 5. Ajustar probabilidades según patrones globales
    ajustarProbabilidadesSegunPatrones(modeloTablero, mapaProbabilidades);
    
    return mapaProbabilidades;
};

/**
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
                        const distancia = distanciaManhattan(fi, cj, i, j);
                        distanciaMinima = Math.min(distanciaMinima, distancia);
                    }
                }
            }
            
            // Si está muy lejos de cualquier número, es muy poco probable que tenga mina
            if (distanciaMinima > 3 && mapaProbabilidades[clave]) {
                // Reducir más la probabilidad cuanto más lejos esté
                const factorDistancia = Math.min(0.1, 0.02 * distanciaMinima);
                mapaProbabilidades[clave].probabilidad = Math.max(0.01, mapaProbabilidades[clave].probabilidad - factorDistancia);
                mapaProbabilidades[clave].origen = 'celda muy alejada';
            }
        }
    }
};

/**
 * Ajusta probabilidades según patrones globales en el tablero
 * @param {object} modeloTablero - Modelo del tablero
 * @param {object} mapaProbabilidades - Mapa de probabilidades a actualizar
 */
const ajustarProbabilidadesSegunPatrones = (modeloTablero, mapaProbabilidades) => {
    const { estadoCeldas, tamañoTablero } = modeloTablero;
    const { filas, columnas } = tamañoTablero;
    
    // Identificar patrones y ajustar probabilidades
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            const clave = `${i},${j}`;
            
            // Solo procesar celdas sin descubrir y sin bandera
            if (!mapaProbabilidades[clave]) continue;
            
            // Factor de borde: las celdas en los bordes y esquinas tienen históricamente
            // menos probabilidad de contener minas en muchos diseños de Buscaminas
            const distanciaBordeActual = distanciaBorde(i, j, tamañoTablero);
            
            // Celdas en esquinas y bordes (ajustar ligeramente hacia abajo)
            if (distanciaBordeActual === 0) {
                // Reducir un 15% para celdas de borde
                mapaProbabilidades[clave].probabilidad *= 0.85;
                mapaProbabilidades[clave].origen = 'patrón de borde';
            }
            // Celdas interiores pero cercanas a los bordes
            else if (distanciaBordeActual === 1) {
                // Reducir un 5% para celdas cercanas al borde
                mapaProbabilidades[clave].probabilidad *= 0.95;
            }
            // Las celdas muy centrales suelen tener más minas
            else if (distanciaBordeActual > Math.min(filas, columnas) / 3) {
                // Aumentar ligeramente para celdas centrales
                mapaProbabilidades[clave].probabilidad *= 1.05;
                mapaProbabilidades[clave].probabilidad = Math.min(0.99, mapaProbabilidades[clave].probabilidad);
            }
        }
    }
};

/**
 * Enriquece el mapa de probabilidades con la memoria histórica
 * @param {object} mapaProbabilidades - Mapa de probabilidades base
 * @param {object} memoriaJuego - Memoria del juego
 * @param {object} tamañoTablero - Tamaño del tablero
 * @param {Array} historialMovimientos - Historial de movimientos
 * @param {object} modeloTablero - Modelo del tablero
 * @returns {object} - Mapa de probabilidades enriquecido
 */
const enriquecerMapaProbabilidades = (mapaProbabilidades, memoriaJuego, tamañoTablero, historialMovimientos, modeloTablero) => {
    // Si no hay memoria, retornar el mapa original
    if (!memoriaJuego) return mapaProbabilidades;
    
    console.log("Enriqueciendo mapa de probabilidades con memoria histórica");
    
    const mapaEnriquecido = { ...mapaProbabilidades };
    const { estadoCeldas } = modeloTablero;
    const { filas, columnas } = tamañoTablero;
    
    // Recorrer todas las celdas sin descubrir
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            const clave = `${i},${j}`;
            
            // Si la celda ya está descubierta o tiene bandera, saltarla
            if (estadoCeldas[i][j].descubierta || estadoCeldas[i][j].tieneBandera || !mapaEnriquecido[clave]) {
                continue;
            }
            
            // Evaluar la celda con la memoria histórica
            const evaluacion = evaluarCeldaConMemoria(
                memoriaJuego, i, j, tamañoTablero, historialMovimientos
            );
            
            // Ajustar la probabilidad según el factor de riesgo de la memoria
            // Usamos un enfoque ponderado para combinar ambas fuentes
            const probabilidadOriginal = mapaEnriquecido[clave].probabilidad;
            const factorRiesgoMemoria = evaluacion.factorRiesgo;
            
            // Si hay datos históricos confiables, ponderamos más el factor de memoria
            if (evaluacion.confianza === 'alta') {
                // 60% memoria + 40% análisis actual
                const nuevaProbabilidad = (factorRiesgoMemoria * 0.6) + (probabilidadOriginal * 0.4);
                mapaEnriquecido[clave].probabilidad = nuevaProbabilidad;
                mapaEnriquecido[clave].origen = `${mapaEnriquecido[clave].origen} + memoria histórica`;
                mapaEnriquecido[clave].razonamientoMemoria = evaluacion.razonamiento;
                
                console.log(`Celda (${i+1},${j+1}): Probabilidad ${Math.round(probabilidadOriginal * 100)}% → ${Math.round(nuevaProbabilidad * 100)}% (confianza alta)`);
            } 
            else if (evaluacion.confianza === 'media') {
                // 40% memoria + 60% análisis actual
                const nuevaProbabilidad = (factorRiesgoMemoria * 0.4) + (probabilidadOriginal * 0.6);
                mapaEnriquecido[clave].probabilidad = nuevaProbabilidad;
                mapaEnriquecido[clave].origen = `${mapaEnriquecido[clave].origen} + memoria histórica`;
                mapaEnriquecido[clave].razonamientoMemoria = evaluacion.razonamiento;
                
                console.log(`Celda (${i+1},${j+1}): Probabilidad ${Math.round(probabilidadOriginal * 100)}% → ${Math.round(nuevaProbabilidad * 100)}% (confianza media)`);
            }
            // Para confianza baja, mantenemos más el análisis actual
            else if (Math.abs(factorRiesgoMemoria - probabilidadOriginal) > 0.2) {
                // 20% memoria + 80% análisis actual - solo si hay una diferencia significativa
                const nuevaProbabilidad = (factorRiesgoMemoria * 0.2) + (probabilidadOriginal * 0.8);
                mapaEnriquecido[clave].probabilidad = nuevaProbabilidad;
                mapaEnriquecido[clave].origen = `${mapaEnriquecido[clave].origen} + indicio histórico`;
                mapaEnriquecido[clave].razonamientoMemoria = evaluacion.razonamiento;
                
                console.log(`Celda (${i+1},${j+1}): Probabilidad ${Math.round(probabilidadOriginal * 100)}% → ${Math.round(nuevaProbabilidad * 100)}% (confianza baja, diferencia significativa)`);
            }
        }
    }
    
    return mapaEnriquecido;
};


/**
 * Seleccionar una celda aleatoria entre las disponibles, evitando repeticiones y usando memoria
 * @param {Array} tablero - Estado actual del tablero
 * @param {object} tamañoTablero - Dimensiones del tablero
 * @param {Array} celdasDescubiertas - Celdas ya descubiertas
 * @param {Array} banderas - Banderas colocadas
 * @param {object} memoriaJuego - Memoria del juego
 * @param {Array} historialMovimientos - Historial de movimientos
 * @returns {object} - Celda seleccionada aleatoriamente
 */
/**
 * Seleccionar una celda aleatoria entre las disponibles
 * @param {Array} tablero - Estado actual del tablero
 * @param {object} tamañoTablero - Dimensiones del tablero
 * @param {Array} celdasDescubiertas - Celdas ya descubiertas
 * @param {Array} banderas - Banderas colocadas
 * @param {object} memoriaJuego - Memoria del juego
 * @param {Array} historialMovimientos - Historial de movimientos
 * @returns {object} - Celda seleccionada aleatoriamente
 */
const seleccionarCeldaAleatoria = (
    tablero, 
    tamañoTablero, 
    celdasDescubiertas, 
    banderas, 
    memoriaJuego = null,
    historialMovimientos = []
) => {
    // Validar parámetros
    if (!tamañoTablero || !tamañoTablero.filas || !tamañoTablero.columnas) {
        console.error("Error al seleccionar celda aleatoria: parámetros inválidos");
        // Retornar un valor por defecto seguro
        return { fila: 0, columna: 0 };
    }
    
    console.log("===== SELECCIÓN ALEATORIA PONDERADA =====");
    
    // Lista de celdas disponibles con evaluación
    const celdasDisponibles = [];
    
    // Recorrer el tablero
    for (let i = 0; i < tamañoTablero.filas; i++) {
        for (let j = 0; j < tamañoTablero.columnas; j++) {
            // Verificar si la celda ya ha sido descubierta
            const estaDescubierta = celdasDescubiertas && celdasDescubiertas.some(c => c.fila === i && c.columna === j);
            
            // Verificar si la celda tiene bandera
            const tieneBandera = banderas && banderas.some(b => b.fila === i && b.columna === j);
            
            // Si no está descubierta y no tiene bandera, está disponible
            if (!estaDescubierta && !tieneBandera) {
                let factorRiesgo = 0;
                let razonamiento = ["Selección aleatoria"];
                
                // Evaluar con memoria si está disponible
                if (memoriaJuego) {
                    const evaluacion = evaluarCeldaConMemoria(
                        memoriaJuego, i, j, tamañoTablero, historialMovimientos
                    );
                    factorRiesgo = evaluacion.factorRiesgo;
                    razonamiento = [...razonamiento, ...evaluacion.razonamiento];
                }
                
                celdasDisponibles.push({
                    fila: i,
                    columna: j,
                    factorRiesgo,
                    razonamiento
                });
            }
        }
    }
    
    console.log(`Encontradas ${celdasDisponibles.length} celdas disponibles para selección aleatoria`);
    
    // Si hay celdas disponibles, seleccionar una ponderando por su riesgo
    if (celdasDisponibles.length > 0) {
        // Ordenar por factor de riesgo (menor primero = más seguras)
        celdasDisponibles.sort((a, b) => a.factorRiesgo - b.factorRiesgo);
        
        // Mostrar top opciones
        console.log(`Top opciones para selección aleatoria:`);
        celdasDisponibles.slice(0, Math.min(3, celdasDisponibles.length)).forEach((celda, idx) => {
            console.log(`${idx+1}. (${celda.fila + 1},${celda.columna + 1}) - Riesgo: ${Math.round(celda.factorRiesgo * 100)}%`);
        });
        
        // Seleccionar entre el 33% más seguro con algo de aleatoriedad
        const topSeguras = Math.max(1, Math.ceil(celdasDisponibles.length * 0.33));
        const indiceAleatorio = Math.floor(Math.random() * topSeguras);
        
        const seleccion = celdasDisponibles[indiceAleatorio];
        console.log(`SELECCIONADA ALEATORIAMENTE: Celda (${seleccion.fila + 1},${seleccion.columna + 1})`);
        console.log(`Riesgo: ${Math.round(seleccion.factorRiesgo * 100)}%`);
        
        seleccion.tipoAnalisis = 'selección aleatoria ponderada';
        seleccion.origen = 'análisis aleatorio con memoria';
        seleccion.explicacion = `Esta celda fue seleccionada aleatoriamente entre las opciones más seguras, con un riesgo estimado de ${Math.round(seleccion.factorRiesgo * 100)}%`;
        console.log("===== FIN DE SELECCIÓN ALEATORIA =====");
        return seleccion;
    }
    
    console.log("No hay celdas disponibles para selección aleatoria");
    console.log("===== FIN DE SELECCIÓN ALEATORIA =====");
    // Si no hay celdas disponibles (raro), retornar null
    return null;
};

// Añadir esta función en src/utils/logicaJuego.js

/**
 * Determina la mejor jugada utilizando un enfoque basado en capas
 * @param {object} modeloTablero - Modelo del tablero
 * @param {object} mapaProbabilidades - Mapa de probabilidades
 * @param {Array} celdasSeguras - Celdas identificadas como seguras
 * @param {Array} historialMovimientos - Historial de movimientos
 * @param {object} memoriaJuego - Memoria del juego
 * @param {object} tamañoTablero - Tamaño del tablero
 * @returns {object} - Mejor celda para seleccionar
 */
export const determinarMejorJugadaEnCapas = (
    modeloTablero, 
    mapaProbabilidades, 
    celdasSeguras, 
    historialMovimientos,
    memoriaJuego,
    tamañoTablero
) => {
    // CAPA 1: SEGURIDAD ABSOLUTA - CELDAS ADYACENTES A CEROS
    // Priorizar celdas adyacentes a ceros ya que tienen 0% de probabilidad de mina
    if (celdasSeguras.length > 0) {
        console.log(`Análisis por capas - CAPA 1: Celdas 100% seguras (${celdasSeguras.length})`);
        
        // Primero, buscar celdas seguras que sean adyacentes a ceros
        const celdasAdyacentesACero = celdasSeguras.filter(
            celda => celda.origen === 'adyacente a cero'
        );
        
        // Si hay celdas adyacentes a ceros, priorizar esas
        if (celdasAdyacentesACero.length > 0) {
            console.log(`- Encontradas ${celdasAdyacentesACero.length} celdas adyacentes a ceros (máxima prioridad)`);
            
            // Elegir la celda segura que esté más cerca del último movimiento
            let mejorCeldaSegura = celdasAdyacentesACero[0];
            let distanciaMinima = Number.MAX_SAFE_INTEGER;
            
            // Si hay movimientos previos, buscar la celda segura más cercana al último
            if (historialMovimientos.length > 0) {
                // Filtrar solo las selecciones (no banderas)
                const selecciones = historialMovimientos.filter(mov => !mov.esAccion);
                
                if (selecciones.length > 0) {
                    const ultimaSeleccion = selecciones[selecciones.length - 1];
                    console.log(`- Buscando celda segura más cercana a última selección (${ultimaSeleccion.fila + 1},${ultimaSeleccion.columna + 1})`);
                    
                    celdasAdyacentesACero.forEach(celda => {
                        const distancia = distanciaManhattan(
                            celda.fila, celda.columna, 
                            ultimaSeleccion.fila, ultimaSeleccion.columna
                        );
                        
                        if (distancia < distanciaMinima) {
                            distanciaMinima = distancia;
                            mejorCeldaSegura = celda;
                        }
                    });
                }
            }
            
            console.log(`DECISIÓN: Celda segura adyacente a cero (${mejorCeldaSegura.fila + 1},${mejorCeldaSegura.columna + 1})`);
            if (distanciaMinima !== Number.MAX_SAFE_INTEGER) {
                console.log(`- A distancia ${distanciaMinima} de la última selección`);
            }
            
            return {
                fila: mejorCeldaSegura.fila,
                columna: mejorCeldaSegura.columna,
                tipoAnalisis: 'celda 100% segura (adyacente a cero)',
                origen: mejorCeldaSegura.origen,
                explicacion: 'Esta celda es 100% segura porque está adyacente a una celda con valor 0 (o vacío)',
                seguridadMáxima: true
            };
        }
        
        // CAPA 1B: OTRAS CELDAS SEGURAS
        // Si no hay celdas adyacentes a ceros, usar cualquier celda segura
        console.log(`- Usando otras celdas seguras identificadas por análisis lógico`);
        
        let mejorCeldaSegura = celdasSeguras[0];
        let distanciaMinima = Number.MAX_SAFE_INTEGER;
        
        // Si hay movimientos previos, buscar la celda segura más cercana al último
        if (historialMovimientos.length > 0) {
            // Filtrar solo las selecciones (no banderas)
            const selecciones = historialMovimientos.filter(mov => !mov.esAccion);
            
            if (selecciones.length > 0) {
                const ultimaSeleccion = selecciones[selecciones.length - 1];
                console.log(`- Buscando celda segura más cercana a última selección (${ultimaSeleccion.fila + 1},${ultimaSeleccion.columna + 1})`);
                
                celdasSeguras.forEach(celda => {
                    const distancia = distanciaManhattan(
                        celda.fila, celda.columna, 
                        ultimaSeleccion.fila, ultimaSeleccion.columna
                    );
                    
                    if (distancia < distanciaMinima) {
                        distanciaMinima = distancia;
                        mejorCeldaSegura = celda;
                    }
                });
            }
        }
        
        console.log(`DECISIÓN: Celda 100% segura (${mejorCeldaSegura.fila + 1},${mejorCeldaSegura.columna + 1})`);
        console.log(`- Origen: ${mejorCeldaSegura.origen}`);
        if (distanciaMinima !== Number.MAX_SAFE_INTEGER) {
            console.log(`- A distancia ${distanciaMinima} de la última selección`);
        }
        
        return {
            fila: mejorCeldaSegura.fila,
            columna: mejorCeldaSegura.columna,
            tipoAnalisis: 'celda 100% segura',
            origen: mejorCeldaSegura.origen,
            explicacion: `Esta celda es 100% segura porque ${mejorCeldaSegura.origen}`,
            seguridadMáxima: true
        };
    }
    
    // CAPA 2: EXPLORACIÓN BASADA EN PROBABILIDAD
    console.log(`Análisis por capas - CAPA 2: No hay celdas 100% seguras, evaluando probabilidades`);
    
    // Convertir mapa de probabilidades a lista de celdas candidatas
    const celdasCandidatas = [];
    
    Object.entries(mapaProbabilidades).forEach(([clave, info]) => {
        const [fila, columna] = clave.split(',').map(Number);
        
        // Verificar que la celda sea válida (no descubierta y sin bandera)
        if (!modeloTablero.estadoCeldas[fila][columna].descubierta && 
            !modeloTablero.estadoCeldas[fila][columna].tieneBandera) {
            
            celdasCandidatas.push({
                fila,
                columna,
                probabilidad: info.probabilidad,
                origen: info.origen,
                razonamientoMemoria: info.razonamientoMemoria || []
            });
        }
    });
    
    console.log(`- Evaluando ${celdasCandidatas.length} celdas candidatas`);
    
    // Si no hay celdas candidatas (raro), seleccionar una celda aleatoria
    if (celdasCandidatas.length === 0) {
        console.log(`- No hay celdas candidatas, seleccionando aleatoriamente`);
        return seleccionarCeldaAleatoria(
            modeloTablero.estadoCeldas, 
            tamañoTablero, 
            modeloTablero.celdasDescubiertas, 
            modeloTablero.banderas,
            memoriaJuego,
            historialMovimientos
        );
    }
    
    // CAPA 2B: CELDAS MUY SEGURAS (menos de 5% de probabilidad)
    console.log(`- Buscando celdas con probabilidad muy baja (<5%)`);
    
    // Identificar celdas con probabilidad muy baja que pueden considerarse seguras
    const celdasMuySeguras = celdasCandidatas.filter(c => c.probabilidad < 0.05);
    if (celdasMuySeguras.length > 0) {
        console.log(`- Encontradas ${celdasMuySeguras.length} celdas muy seguras (<5% de probabilidad de mina)`);
        
        // Ordenar por probabilidad ascendente (menor primero)
        celdasMuySeguras.sort((a, b) => a.probabilidad - b.probabilidad);
        
        // Mostrar las 3 mejores opciones
        const topOpciones = celdasMuySeguras.slice(0, Math.min(3, celdasMuySeguras.length));
        console.log(`- Top opciones muy seguras:`);
        topOpciones.forEach((opcion, idx) => {
            console.log(`  ${idx+1}. (${opcion.fila + 1},${opcion.columna + 1}) - ${Math.round(opcion.probabilidad * 100)}% - ${opcion.origen}`);
        });
        
        // Elegir la celda con menor probabilidad
        const celdaElegida = celdasMuySeguras[0];
        console.log(`DECISIÓN: Celda muy segura (${celdaElegida.fila + 1},${celdaElegida.columna + 1}) - ${Math.round(celdaElegida.probabilidad * 100)}% de probabilidad de mina`);
        
        return {
            fila: celdaElegida.fila,
            columna: celdaElegida.columna,
            tipoAnalisis: `probabilidad muy baja ${Math.round(celdaElegida.probabilidad * 100)}%`,
            origen: celdaElegida.origen,
            razonamientoMemoria: celdaElegida.razonamientoMemoria,
            alternativas: topOpciones.slice(1),  // Guardar alternativas consideradas
            explicacion: `Esta celda tiene una probabilidad muy baja de contener una mina (${Math.round(celdaElegida.probabilidad * 100)}%) comparada con las demás opciones`
        };
    }
    
    // CAPA 3: ANÁLISIS POR NÚMEROS ADYACENTES
    console.log(`Análisis por capas - CAPA 3: Evaluando basado en números adyacentes`);
    
    // Clasificar las celdas según los números adyacentes
    celdasCandidatas.forEach(celda => {
        const { fila, columna } = celda;
        const celdasAdyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
        
        // Análisis completo de todos los números adyacentes (del 0 al 8)
        let maxNumeroAdyacente = -1;
        let esAdyacenteAlto = false;
        
        celdasAdyacentes.forEach(adj => {
            if (modeloTablero.celdasDescubiertas.some(desc => 
                desc.fila === adj.fila && desc.columna === adj.columna
            )) {
                const valor = modeloTablero.estadoCeldas[adj.fila][adj.columna].valor;
                if (valor !== '' && valor !== 'M' && !isNaN(valor)) {
                    const numValor = parseInt(valor);
                    maxNumeroAdyacente = Math.max(maxNumeroAdyacente, numValor);
                    
                    // Números 4-8 son considerados de alto riesgo
                    if (numValor >= 4) {
                        esAdyacenteAlto = true;
                    }
                }
            }
        });
        
        // Asignar propiedades de análisis numérico a la celda
        celda.maxNumeroAdyacente = maxNumeroAdyacente;
        celda.esAdyacenteAlto = esAdyacenteAlto;
        
        // Ajustar la probabilidad según los números adyacentes
        if (maxNumeroAdyacente >= 0) {
            // Escala basada en el valor máximo adyacente
            if (maxNumeroAdyacente === 0) {
                celda.probabilidad = 0; // Adyacente a 0 es siempre seguro
            } else {
                const factorRiesgo = 1 + (maxNumeroAdyacente * 0.1);
                const probAnterior = celda.probabilidad;
                celda.probabilidad *= factorRiesgo;
                
                // Bonus para números muy altos
                if (esAdyacenteAlto) {
                    celda.probabilidad *= 1.1;
                }
                
                celda.probabilidad = Math.min(0.95, celda.probabilidad);
                celda.ajusteNumerico = `${Math.round(probAnterior * 100)}% → ${Math.round(celda.probabilidad * 100)}% por adyacencia a ${maxNumeroAdyacente}`;
            }
        }
    });
    
    // Dividir en celdas de frontera (adyacentes a descubiertas) y no frontera
    const celdasFrontera = celdasCandidatas.filter(c => c.maxNumeroAdyacente >= 0);
    const celdasNoFrontera = celdasCandidatas.filter(c => c.maxNumeroAdyacente === -1);
    
    console.log(`- Celdas de frontera: ${celdasFrontera.length}, Celdas no frontera: ${celdasNoFrontera.length}`);
    
    // CAPA 4: ESTRATEGIA SEGÚN ETAPA DEL JUEGO
    // Determinar la etapa del juego basada en el porcentaje de celdas descubiertas
    const totalCeldas = tamañoTablero.filas * tamañoTablero.columnas;
    const porcentajeDescubierto = (modeloTablero.celdasDescubiertas.length / totalCeldas) * 100;
    
    console.log(`Análisis por capas - CAPA 4: Estrategia según etapa del juego: ${Math.round(porcentajeDescubierto)}% completado`);
    
    let celdaSeleccionada = null;
    
    // Inicio del juego: Favorecer exploración en áreas distintas
    if (porcentajeDescubierto < 15) {
        console.log(`- Etapa: INICIO DEL JUEGO (${Math.round(porcentajeDescubierto)}% completado)`);
        // Priorizar celdas con bajo valor numérico adyacente (0-1)
        const celdasSeguras = celdasCandidatas.filter(c => 
            (c.maxNumeroAdyacente === -1 || c.maxNumeroAdyacente <= 1) && 
            c.probabilidad < 0.15
        );
        
        if (celdasSeguras.length > 0) {
            console.log(`- Encontradas ${celdasSeguras.length} celdas favorables para inicio de juego`);
            
            // Al inicio, diversificar la exploración seleccionando celdas lejos de movimientos anteriores
            if (historialMovimientos.length > 0) {
                const movimientosAnteriores = historialMovimientos.filter(m => !m.esAccion);
                
                // Calcular distancia a movimientos anteriores
                celdasSeguras.forEach(celda => {
                    let distanciaMinima = Number.MAX_SAFE_INTEGER;
                    
                    movimientosAnteriores.forEach(mov => {
                        const distancia = distanciaManhattan(
                            celda.fila, celda.columna, mov.fila, mov.columna
                        );
                        distanciaMinima = Math.min(distanciaMinima, distancia);
                    });
                    
                    celda.distanciaAnteriores = distanciaMinima;
                });
                
                // Ordenar por distancia (más lejanas primero para diversificar)
                celdasSeguras.sort((a, b) => b.distanciaAnteriores - a.distanciaAnteriores);
                
                // Seleccionar entre las top 3 con algo de aleatoriedad
                const topN = Math.min(3, celdasSeguras.length);
                const indiceAleatorio = Math.floor(Math.random() * topN);
                celdaSeleccionada = celdasSeguras[indiceAleatorio];
                
                console.log(`DECISIÓN: Celda para diversificar exploración (${celdaSeleccionada.fila + 1},${celdaSeleccionada.columna + 1})`);
                console.log(`- Distancia a movimientos anteriores: ${celdaSeleccionada.distanciaAnteriores}`);
                console.log(`- Probabilidad de mina: ${Math.round(celdaSeleccionada.probabilidad * 100)}%`);
                
                celdaSeleccionada.explicacion = `Esta celda se seleccionó para diversificar la exploración, estando a una distancia ${celdaSeleccionada.distanciaAnteriores} de movimientos anteriores`;
            } else {
                // Primer movimiento, seleccionar al azar entre las seguras
                const indiceAleatorio = Math.floor(Math.random() * celdasSeguras.length);
                celdaSeleccionada = celdasSeguras[indiceAleatorio];
                
                console.log(`DECISIÓN: Primer movimiento (${celdaSeleccionada.fila + 1},${celdaSeleccionada.columna + 1})`);
                console.log(`- Probabilidad de mina: ${Math.round(celdaSeleccionada.probabilidad * 100)}%`);
                
                celdaSeleccionada.explicacion = "Esta celda se seleccionó como primer movimiento, priorizando posiciones estratégicas";
            }
        }
    }
    // Mitad del juego: Priorizar celdas de frontera con baja probabilidad
    else if (porcentajeDescubierto < 50) {
        console.log(`- Etapa: MITAD DEL JUEGO (${Math.round(porcentajeDescubierto)}% completado)`);
        // Filtrar celdas de frontera con bajo riesgo (no adyacentes a números altos)
        const celdasFronteraSeguras = celdasFrontera.filter(c => !c.esAdyacenteAlto);
        
        if (celdasFronteraSeguras.length > 0) {
            console.log(`- Encontradas ${celdasFronteraSeguras.length} celdas de frontera de bajo riesgo`);
            
            // Ordenar por valor numérico adyacente (menor primero) y luego por probabilidad
            celdasFronteraSeguras.sort((a, b) => {
                // Primero por valor numérico adyacente
                if (a.maxNumeroAdyacente !== b.maxNumeroAdyacente) {
                    return a.maxNumeroAdyacente - b.maxNumeroAdyacente;
                }
                // Luego por probabilidad
                return a.probabilidad - b.probabilidad;
            });
            
            // Seleccionar la mejor candidata de frontera
            celdaSeleccionada = celdasFronteraSeguras[0];
            console.log(`DECISIÓN: Celda de frontera (${celdaSeleccionada.fila + 1},${celdaSeleccionada.columna + 1})`);
            console.log(`- Número máximo adyacente: ${celdaSeleccionada.maxNumeroAdyacente}`);
            console.log(`- Probabilidad de mina: ${Math.round(celdaSeleccionada.probabilidad * 100)}%`);
            
            celdaSeleccionada.explicacion = `Esta celda se seleccionó por ser de frontera con bajo riesgo, adyacente a número ${celdaSeleccionada.maxNumeroAdyacente}`;
        } else if (celdasNoFrontera.length > 0) {
            console.log(`- No hay celdas de frontera seguras, usando celdas no frontera`);
            // Si no hay celdas de frontera seguras, usar celdas no frontera
            celdasNoFrontera.sort((a, b) => a.probabilidad - b.probabilidad);
            
            celdaSeleccionada = celdasNoFrontera[0];
            console.log(`DECISIÓN: Celda no frontera (${celdaSeleccionada.fila + 1},${celdaSeleccionada.columna + 1})`);
            console.log(`- Probabilidad de mina: ${Math.round(celdaSeleccionada.probabilidad * 100)}%`);
            
            celdaSeleccionada.explicacion = "Esta celda no frontera se seleccionó por tener la menor probabilidad de mina";
        }
    }
    // Final del juego: Análisis más conservador
    else {
        console.log(`- Etapa: FINAL DEL JUEGO (${Math.round(porcentajeDescubierto)}% completado)`);
        // Ordenar todas las celdas por probabilidad ascendente
        celdasCandidatas.sort((a, b) => a.probabilidad - b.probabilidad);
        
        // Seleccionar la celda con menor probabilidad de mina
        celdaSeleccionada = celdasCandidatas[0];
        console.log(`DECISIÓN: Celda menos riesgosa (${celdaSeleccionada.fila + 1},${celdaSeleccionada.columna + 1})`);
        console.log(`- Probabilidad de mina: ${Math.round(celdaSeleccionada.probabilidad * 100)}%`);
        
        celdaSeleccionada.explicacion = `Etapa final: Esta celda tiene la menor probabilidad de contener una mina (${Math.round(celdaSeleccionada.probabilidad * 100)}%)`;
    }
    
    // Si no se ha seleccionado ninguna celda, usar algoritmo básico
    if (!celdaSeleccionada) {
        console.log(`- Ninguna celda seleccionada por estrategias anteriores, usando algoritmo básico`);
        // Ordenar por probabilidad ascendente
        celdasCandidatas.sort((a, b) => a.probabilidad - b.probabilidad);
        
        // Priorizar celdas no adyacentes a números altos (4-8)
        const celdasNoAdyacentesAlto = celdasCandidatas.filter(c => !c.esAdyacenteAlto);
        
        if (celdasNoAdyacentesAlto.length > 0) {
            console.log(`- Encontradas ${celdasNoAdyacentesAlto.length} celdas no adyacentes a números altos`);
            
            celdaSeleccionada = celdasNoAdyacentesAlto[0];
            console.log(`DECISIÓN: Celda no adyacente a números altos (${celdaSeleccionada.fila + 1},${celdaSeleccionada.columna + 1})`);
            console.log(`- Probabilidad de mina: ${Math.round(celdaSeleccionada.probabilidad * 100)}%`);
            
            celdaSeleccionada.explicacion = `Esta celda tiene la menor probabilidad de contener una mina (${Math.round(celdaSeleccionada.probabilidad * 100)}%) y no está adyacente a números altos`;
        } else {
            console.log(`- Todas las celdas están adyacentes a números altos`);
            // Si todas están adyacentes a números altos, elegir la de menor probabilidad
            celdaSeleccionada = celdasCandidatas[0];
            console.log(`DECISIÓN: Celda menos riesgosa (${celdaSeleccionada.fila + 1},${celdaSeleccionada.columna + 1})`);
            console.log(`- Probabilidad de mina: ${Math.round(celdaSeleccionada.probabilidad * 100)}%`);
            
            celdaSeleccionada.explicacion = `Esta celda tiene la menor probabilidad de contener una mina (${Math.round(celdaSeleccionada.probabilidad * 100)}%) entre todas las opciones disponibles`;
        }
    }
    
    // Agregar las celdas alternativas consideradas (para ver comparativas)
    const alternativas = celdasCandidatas
        .filter(c => c.fila !== celdaSeleccionada.fila || c.columna !== celdaSeleccionada.columna)
        .sort((a, b) => a.probabilidad - b.probabilidad)
        .slice(0, 3);
    
    // Construir el resultado con información de razonamiento
    return {
        fila: celdaSeleccionada.fila,
        columna: celdaSeleccionada.columna,
        tipoAnalisis: `probabilidad ${Math.round(celdaSeleccionada.probabilidad * 100)}%`,
        origen: celdaSeleccionada.origen,
        razonamientoMemoria: celdaSeleccionada.razonamientoMemoria,
        alternativas: alternativas,
        explicacion: celdaSeleccionada.explicacion || `Esta celda tiene ${Math.round(celdaSeleccionada.probabilidad * 100)}% de probabilidad de contener una mina`,
        ajusteNumerico: celdaSeleccionada.ajusteNumerico
    };
};

/**
 * Registrar una derrota y aprender de ella
 * @param {object} celda - Celda donde se encontró una mina {fila, columna}
 */
/**
 * Registrar una derrota y aprender de ella
 * @param {object} celda - Celda donde se encontró una mina {fila, columna}
 */
export const aprenderDeDerrota = (celda) => {
    if (!celda || celda.fila === undefined || celda.columna === undefined) {
        return;
    }
    
    console.log(`===== APRENDIZAJE DEL SISTEMA =====`);
    console.log(`Aprendiendo de mina encontrada en (${celda.fila + 1},${celda.columna + 1})`);
    
    // Registrar en el historial de derrotas
    try {
        const derrota = registrarDerrota(celda.fila, celda.columna);
        if (derrota) {
            console.log(`Registro exitoso: Esta celda ahora ha sido registrada ${derrota.find(d => d.fila === celda.fila && d.columna === celda.columna)?.veces || 1} veces como mina`);
            
            // Mostrar las 5 celdas con más minas registradas
            const topMinas = derrota.slice(0, 5);
            if (topMinas.length > 0) {
                console.log(`Top 5 celdas con más minas registradas:`);
                topMinas.forEach((mina, idx) => {
                    console.log(`  ${idx + 1}. (${mina.fila + 1},${mina.columna + 1}) - ${mina.veces} veces`);
                });
            }
        } else {
            console.log(`No se pudo registrar la derrota correctamente`);
        }
    } catch (error) {
        console.error(`Error al registrar derrota:`, error);
    }
    
    console.log(`En el futuro, el sistema evitará seleccionar esta celda o celdas con patrones similares`);
    console.log(`===== FIN DE APRENDIZAJE =====`);
};

/**
 * Analiza subconjuntos de restricciones para identificar banderas, con explicación detallada
 * @param {object} modeloTablero - Modelo del tablero
 * @param {Array} banderasYaIdentificadas - Banderas ya identificadas para no duplicar
 * @returns {Array} - Nuevas banderas descubiertas
 */
const analizarSubconjuntos = (modeloTablero, banderasYaIdentificadas) => {
    const { restricciones, estadoCeldas, tamañoTablero } = modeloTablero;
    const nuevasBanderas = [];
    
    console.log("INICIO: Análisis detallado de subconjuntos para banderas");
    
    // Para cada par de restricciones, buscar si una es subconjunto de otra
    for (let i = 0; i < restricciones.length; i++) {
        const r1 = restricciones[i];
        
        for (let j = 0; j < restricciones.length; j++) {
            if (i === j) continue;
            
            const r2 = restricciones[j];
            
            console.log(`\nComparando restricciones:`);
            console.log(`- R1: (${r1.celda.fila + 1},${r1.celda.columna + 1}) valor ${r1.valor}, minas faltantes ${r1.minasFaltantes}`);
            console.log(`- R2: (${r2.celda.fila + 1},${r2.celda.columna + 1}) valor ${r2.valor}, minas faltantes ${r2.minasFaltantes}`);
            
            // MEJORA: Ignorar restricciones resueltas (sin minas pendientes)
            if (r1.minasFaltantes === 0 || r2.minasFaltantes === 0) {
                console.log("- Ignorando pues al menos una restricción ya tiene todas sus minas identificadas");
                continue;
            }
            
            // Verificar si todas las celdas sin descubrir de r1 están contenidas en r2
            const celdasSinDescubrirR1 = r1.celdasAfectadas.filter(c => 
                !estadoCeldas[c.fila][c.columna].descubierta && 
                !estadoCeldas[c.fila][c.columna].tieneBandera
            );
            
            const celdasSinDescubrirR2 = r2.celdasAfectadas.filter(c => 
                !estadoCeldas[c.fila][c.columna].descubierta && 
                !estadoCeldas[c.fila][c.columna].tieneBandera
            );
            
            // MEJORA: Comprobar si r1 es subconjunto de r2 considerando solo celdas sin descubrir
            const r1EsSubconjuntoDeR2 = esSubconjuntoSinDescubrir(celdasSinDescubrirR1, celdasSinDescubrirR2);
            
            if (r1EsSubconjuntoDeR2) {
                console.log(`✅ El conjunto de celdas sin descubrir de R1 ES SUBCONJUNTO de R2`);
                
                // Calcular las celdas que están en r2 pero no en r1
                const celdasDiferencia = celdasSinDescubrirR2.filter(c2 => 
                    !celdasSinDescubrirR1.some(c1 => c1.fila === c2.fila && c1.columna === c2.columna)
                );
                
                console.log(`- Celdas sin descubrir en R2 pero no en R1: ${celdasDiferencia.length}`);
                
                // Calcular el número de minas en la diferencia
                const minasDiferencia = r2.minasFaltantes - r1.minasFaltantes;
                console.log(`- Minas en la diferencia: ${minasDiferencia}`);
                
                // Si todas las celdas de la diferencia deben ser minas
                if (minasDiferencia > 0 && celdasDiferencia.length === minasDiferencia) {
                    console.log(`🚩 DEDUCCIÓN: Todas las ${celdasDiferencia.length} celdas de la diferencia son minas`);
                    
                    // MEJORA: Verificar conflictos con ceros
                    const hayConflictoConCeros = celdasDiferencia.some(c => {
                        const adyacentes = obtenerCeldasAdyacentes(c.fila, c.columna, tamañoTablero);
                        return adyacentes.some(adj => 
                            estadoCeldas[adj.fila][adj.columna].descubierta && 
                            (estadoCeldas[adj.fila][adj.columna].valor === '0' || 
                             estadoCeldas[adj.fila][adj.columna].valor === '')
                        );
                    });
                    
                    if (hayConflictoConCeros) {
                        console.log(`⚠️ CONFLICTO: Algunas celdas estarían adyacentes a ceros`);
                        continue;
                    }
                    
                    // Verificar contradicciones
                    let hayContradiccion = false;
                    
                    // MEJORA: Verificación más completa con todas las restricciones
                    const verificacionGlobal = verificarConjuntoRestricciones(
                        celdasDiferencia,
                        r2,
                        restricciones,
                        estadoCeldas,
                        tamañoTablero
                    );
                    
                    if (verificacionGlobal.hayContradiccion) {
                        console.log(`⚠️ CONTRADICCIÓN GLOBAL: ${verificacionGlobal.mensaje}`);
                        hayContradiccion = true;
                    }
                    
                    if (!hayContradiccion) {
                        celdasDiferencia.forEach(c => {
                            // Verificar que no tenga bandera ya
                            if (!estadoCeldas[c.fila][c.columna].tieneBandera &&
                                !banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna) &&
                                !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                                
                                console.log(`✅ Nueva bandera en (${c.fila + 1},${c.columna + 1}) por análisis de subconjuntos`);
                                nuevasBanderas.push({
                                    fila: c.fila,
                                    columna: c.columna,
                                    origen: 'análisis de subconjuntos',
                                    celdaOrigen1: r1.celda,
                                    celdaOrigen2: r2.celda,
                                    detalle: `Las celdas sin descubrir de (${r1.celda.fila + 1},${r1.celda.columna + 1})=${r1.valor} son subconjunto de (${r2.celda.fila + 1},${r2.celda.columna + 1})=${r2.valor}, con ${minasDiferencia} minas en las ${celdasDiferencia.length} celdas de diferencia.`
                                });
                                
                                // Actualizar estado para verificaciones posteriores
                                estadoCeldas[c.fila][c.columna].tieneBandera = true;
                            }
                        });
                    } else {
                        console.log(`⛔ Omitiendo banderas por contradicciones`);
                    }
                } else if (celdasDiferencia.length === 0) {
                    console.log(`- Sin celdas de diferencia para analizar`);
                } else if (minasDiferencia <= 0) {
                    console.log(`- No hay minas en la diferencia (${minasDiferencia})`);
                } else {
                    console.log(`- Las ${minasDiferencia} minas deben estar en ${celdasDiferencia.length} celdas, información insuficiente`);
                }
            } else {
                // MEJORA: Comprobar también el otro sentido (r2 subconjunto de r1)
                const r2EsSubconjuntoDeR1 = esSubconjuntoSinDescubrir(celdasSinDescubrirR2, celdasSinDescubrirR1);
                
                if (r2EsSubconjuntoDeR1) {
                    console.log(`✅ El conjunto de celdas sin descubrir de R2 ES SUBCONJUNTO de R1`);
                    
                    // Calcular las celdas que están en r1 pero no en r2
                    const celdasDiferencia = celdasSinDescubrirR1.filter(c1 => 
                        !celdasSinDescubrirR2.some(c2 => c2.fila === c1.fila && c2.columna === c1.columna)
                    );
                    
                    console.log(`- Celdas sin descubrir en R1 pero no en R2: ${celdasDiferencia.length}`);
                    
                    // Calcular el número de minas en la diferencia
                    const minasDiferencia = r1.minasFaltantes - r2.minasFaltantes;
                    console.log(`- Minas en la diferencia: ${minasDiferencia}`);
                    
                    // Análogo al caso anterior, procesando en sentido inverso...
                    if (minasDiferencia > 0 && celdasDiferencia.length === minasDiferencia) {
                        // Mismo procesamiento, adaptado para este caso
                        console.log(`🚩 DEDUCCIÓN: Todas las ${celdasDiferencia.length} celdas de la diferencia son minas`);
                        
                        // Similar al caso anterior, con las verificaciones correspondientes...
                        // [Código similar al del caso anterior, adaptado]
                    }
                } else {
                    console.log(`- No hay relación de subconjunto entre estas restricciones`);
                }
            }
        }
    }
    
    console.log(`\nRESULTADO: ${nuevasBanderas.length} nuevas banderas identificadas por análisis de subconjuntos`);
    return nuevasBanderas;
};

// Función auxiliar modificada
const esSubconjuntoSinDescubrir = (conjunto1, conjunto2) => {
    if (conjunto1.length === 0) return true; // Conjunto vacío es subconjunto de cualquier conjunto
    if (conjunto1.length > conjunto2.length) return false;
    
    // Verificar si cada elemento de conjunto1 está en conjunto2
    return conjunto1.every(c1 => 
        conjunto2.some(c2 => c1.fila === c2.fila && c1.columna === c2.columna)
    );
};
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
 * Detecta patrones específicos como 1-2-1 para identificar banderas con explicación detallada
 * @param {object} modeloTablero - Modelo del tablero
 * @param {Array} banderasYaIdentificadas - Banderas ya identificadas para no duplicar
 * @returns {Array} - Nuevas banderas identificadas
 */
const detectarPatronesParaBanderas = (modeloTablero, banderasYaIdentificadas) => {
    const { estadoCeldas, tamañoTablero } = modeloTablero;
    const { filas, columnas } = tamañoTablero;
    const nuevasBanderas = [];
    
    console.log("INICIO: Análisis extendido de patrones para banderas");
    
    // 1. PATRONES LINEALES: 1-2-1, 2-3-2, 3-4-3, 2-4-2, etc.
    console.log("\nBuscando patrones lineales (N-(N+1)-N):");
    const direcciones = [
        { dx: 1, dy: 0, nombre: "horizontal" },
        { dx: 0, dy: 1, nombre: "vertical" }
    ];
    
    // Buscar patrones en cada dirección
    direcciones.forEach(({ dx, dy, nombre }) => {
        console.log(`- Buscando patrones lineales ${nombre}`);
        
        // Recorrer todo el tablero
        for (let i = 0; i < filas - 2 * dy; i++) {
            for (let j = 0; j < columnas - 2 * dx; j++) {
                // Posiciones de las tres celdas en el patrón
                const pos1 = { fila: i, columna: j };
                const pos2 = { fila: i + dy, columna: j + dx };
                const pos3 = { fila: i + 2*dy, columna: j + 2*dx };
                
                // Verificar si las tres celdas están descubiertas y tienen valores
                if (estadoCeldas[pos1.fila][pos1.columna].descubierta && 
                    estadoCeldas[pos2.fila][pos2.columna].descubierta && 
                    estadoCeldas[pos3.fila][pos3.columna].descubierta) {
                    
                    const valor1 = estadoCeldas[pos1.fila][pos1.columna].valor;
                    const valor2 = estadoCeldas[pos2.fila][pos2.columna].valor;
                    const valor3 = estadoCeldas[pos3.fila][pos3.columna].valor;
                    
                    // Verificar si es un patrón N-(N+1)-N
                    if (valor1 !== '' && valor1 !== 'M' && !isNaN(valor1) &&
                        valor2 !== '' && valor2 !== 'M' && !isNaN(valor2) &&
                        valor3 !== '' && valor3 !== 'M' && !isNaN(valor3)) {
                        
                        const num1 = parseInt(valor1);
                        const num2 = parseInt(valor2);
                        const num3 = parseInt(valor3);
                        
                        // Patrones posibles: 1-2-1, 2-3-2, 3-4-3, etc.
                        if (num1 === num3 && num2 === num1 + 1) {
                            console.log(`\n🔍 Patrón ${num1}-${num2}-${num1} ${nombre} detectado en (${pos1.fila + 1},${pos1.columna + 1}) - (${pos2.fila + 1},${pos2.columna + 1}) - (${pos3.fila + 1},${pos3.columna + 1})`);
                            
                            // Buscar las celdas adyacentes al valor central que no son adyacentes a los extremos
                            const adyacentesACentro = obtenerCeldasAdyacentes(pos2.fila, pos2.columna, tamañoTablero);
                            const adyacentesA1 = obtenerCeldasAdyacentes(pos1.fila, pos1.columna, tamañoTablero);
                            const adyacentesA3 = obtenerCeldasAdyacentes(pos3.fila, pos3.columna, tamañoTablero);
                            
                            // Celdas únicas del centro (no adyacentes a los extremos)
                            const celdasUnicas = adyacentesACentro.filter(c2 => 
                                !adyacentesA1.some(c1 => c1.fila === c2.fila && c1.columna === c2.columna) &&
                                !adyacentesA3.some(c3 => c3.fila === c2.fila && c3.columna === c3.columna) &&
                                !estadoCeldas[c2.fila][c2.columna].descubierta &&
                                !estadoCeldas[c2.fila][c2.columna].tieneBandera
                            );
                            
                            console.log(`- Celdas únicas adyacentes al ${num2} (sin descubrir/sin bandera): ${celdasUnicas.length}`);
                            
                            // Verificar banderas ya colocadas
                            const banderasAdyacentesACentro = adyacentesACentro.filter(c => 
                                estadoCeldas[c.fila][c.columna].tieneBandera ||
                                banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna)
                            ).length;
                            
                            console.log(`- Banderas ya colocadas adyacentes al ${num2}: ${banderasAdyacentesACentro}`);
                            
                            // Minas faltantes para la celda central
                            const minasFaltantesEnCentro = num2 - banderasAdyacentesACentro;
                            
                            // Si todas las celdas únicas deben ser minas
                            if (minasFaltantesEnCentro > 0 && celdasUnicas.length === minasFaltantesEnCentro) {
                                console.log(`✅ PATRÓN ${num1}-${num2}-${num1}: Las ${celdasUnicas.length} celdas únicas son minas (faltan ${minasFaltantesEnCentro} minas)`);
                                
                                // Verificar contradicciones con ceros
                                const hayContradiccionConCeros = celdasUnicas.some(c => {
                                    const adyacentes = obtenerCeldasAdyacentes(c.fila, c.columna, tamañoTablero);
                                    return adyacentes.some(adj => 
                                        estadoCeldas[adj.fila][adj.columna].descubierta && 
                                        (estadoCeldas[adj.fila][adj.columna].valor === '0' || 
                                        estadoCeldas[adj.fila][adj.columna].valor === '')
                                    );
                                });
                                
                                if (!hayContradiccionConCeros) {
                                    celdasUnicas.forEach(c => {
                                        if (!estadoCeldas[c.fila][c.columna].tieneBandera &&
                                            !banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna) &&
                                            !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                                            
                                            console.log(`🚩 Nueva bandera en (${c.fila + 1},${c.columna + 1}) por patrón ${num1}-${num2}-${num1}`);
                                            nuevasBanderas.push({
                                                fila: c.fila,
                                                columna: c.columna,
                                                origen: `patrón ${num1}-${num2}-${num1}`,
                                                patron: {
                                                    celda1: pos1,
                                                    celda2: pos2,
                                                    celda3: pos3
                                                },
                                                detalle: `Patrón ${num1}-${num2}-${num1} ${nombre} en (${pos1.fila + 1},${pos1.columna + 1}), (${pos2.fila + 1},${pos2.columna + 1}), (${pos3.fila + 1},${pos3.columna + 1})`
                                            });
                                            
                                            // Actualizar estado
                                            estadoCeldas[c.fila][c.columna].tieneBandera = true;
                                        }
                                    });
                                }
                            }
                        }
                        
                        // NUEVO: Patrón 1-3-1 (caso especial que implica dos minas diagonales)
                        if (num1 === 1 && num2 === 3 && num3 === 1) {
                            console.log(`\n🔍 Patrón especial 1-3-1 ${nombre} detectado (posible diagonal)`);
                            
                            // Buscar celdas únicas como antes
                            const adyacentesACentro = obtenerCeldasAdyacentes(pos2.fila, pos2.columna, tamañoTablero);
                            const adyacentesA1 = obtenerCeldasAdyacentes(pos1.fila, pos1.columna, tamañoTablero);
                            const adyacentesA3 = obtenerCeldasAdyacentes(pos3.fila, pos3.columna, tamañoTablero);
                            
                            const celdasUnicas = adyacentesACentro.filter(c2 => 
                                !adyacentesA1.some(c1 => c1.fila === c2.fila && c1.columna === c2.columna) &&
                                !adyacentesA3.some(c3 => c3.fila === c2.fila && c3.columna === c3.columna) &&
                                !estadoCeldas[c2.fila][c2.columna].descubierta &&
                                !estadoCeldas[c2.fila][c2.columna].tieneBandera
                            );
                            
                            // Analizar si hay exactamente 2 celdas únicas en diagonal
                            if (celdasUnicas && celdasUnicas.length === 2) {
                                // Verificar si están en diagonal
                                const [c1, c2] = celdasUnicas;
                                const esDiagonal = Math.abs(c1.fila - c2.fila) === 1 && 
                                                Math.abs(c1.columna - c2.columna) === 1;
                                
                                if (esDiagonal) {
                                    console.log(`✅ PATRÓN 1-3-1 DIAGONAL: Las 2 celdas únicas diagonales son minas`);
                                    
                                    celdasUnicas.forEach(c => {
                                        if (!estadoCeldas[c.fila][c.columna].tieneBandera &&
                                            !banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna) &&
                                            !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                                            
                                            console.log(`🚩 Nueva bandera en (${c.fila + 1},${c.columna + 1}) por patrón 1-3-1 diagonal`);
                                            nuevasBanderas.push({
                                                fila: c.fila,
                                                columna: c.columna,
                                                origen: 'patrón 1-3-1 diagonal',
                                                detalle: `Patrón 1-3-1 con minas diagonales`
                                            });
                                            
                                            estadoCeldas[c.fila][c.columna].tieneBandera = true;
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    
    // 2. PATRONES ADYACENTES DE NÚMEROS MAYORES (N-M DONDE N,M > 1)
    console.log("\nBuscando patrones de números adyacentes mayores:");
    
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            // Verificar si esta celda es un número descubierto
            if (estadoCeldas[i][j].descubierta && 
                estadoCeldas[i][j].valor !== '' && 
                estadoCeldas[i][j].valor !== 'M' && 
                !isNaN(estadoCeldas[i][j].valor)) {
                
                const valorActual = parseInt(estadoCeldas[i][j].valor);
                
                // Solo analizar números mayores que 1
                if (valorActual > 1) {
                    const adyacentesActual = obtenerCeldasAdyacentes(i, j, tamañoTablero);
                    
                    // Buscar otros números adyacentes
                    const adyacentesConNumeros = adyacentesActual.filter(adj => 
                        estadoCeldas[adj.fila][adj.columna].descubierta && 
                        estadoCeldas[adj.fila][adj.columna].valor !== '' && 
                        estadoCeldas[adj.fila][adj.columna].valor !== 'M' && 
                        !isNaN(estadoCeldas[adj.fila][adj.columna].valor) &&
                        parseInt(estadoCeldas[adj.fila][adj.columna].valor) > 1
                    );
                    
                    if (adyacentesConNumeros.length > 0) {
                        adyacentesConNumeros.forEach(adyacente => {
                            // Evitar analizar el mismo par dos veces
                            if (i > adyacente.fila || (i === adyacente.fila && j > adyacente.columna)) return;
                            
                            const valorAdyacente = parseInt(estadoCeldas[adyacente.fila][adyacente.columna].valor);
                            
                            console.log(`\n🔍 Patrón ${valorActual}-${valorAdyacente} adyacentes en (${i + 1},${j + 1}) y (${adyacente.fila + 1},${adyacente.columna + 1})`);
                            
                            // Obtener adyacentes del número adyacente
                            const adyacentesDelAdyacente = obtenerCeldasAdyacentes(adyacente.fila, adyacente.columna, tamañoTablero);
                            
                            // Obtener celdas compartidas (adyacentes a ambos números)
                            const celdasCompartidas = adyacentesActual.filter(cA => 
                                adyacentesDelAdyacente.some(cB => cA.fila === cB.fila && cA.columna === cB.columna) &&
                                !estadoCeldas[cA.fila][cA.columna].descubierta &&
                                !estadoCeldas[cA.fila][cA.columna].tieneBandera
                            );
                            
                            // Obtener celdas exclusivas de cada número
                            const celdasExclusivasActual = adyacentesActual.filter(cA => 
                                !adyacentesDelAdyacente.some(cB => cA.fila === cB.fila && cA.columna === cB.columna) &&
                                !estadoCeldas[cA.fila][cA.columna].descubierta &&
                                !estadoCeldas[cA.fila][cA.columna].tieneBandera
                            );
                            
                            const celdasExclusivasAdyacente = adyacentesDelAdyacente.filter(cB => 
                                !adyacentesActual.some(cA => cB.fila === cA.fila && cB.columna === cA.columna) &&
                                !estadoCeldas[cB.fila][cB.columna].descubierta &&
                                !estadoCeldas[cB.fila][cB.columna].tieneBandera
                            );
                            
                            // Contar banderas ya colocadas
                            const banderasActual = adyacentesActual.filter(c => 
                                estadoCeldas[c.fila][c.columna].tieneBandera ||
                                banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna)
                            ).length;
                            
                            const banderasAdyacente = adyacentesDelAdyacente.filter(c => 
                                estadoCeldas[c.fila][c.columna].tieneBandera ||
                                banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna)
                            ).length;
                            
                            console.log(`- Celdas compartidas: ${celdasCompartidas.length}`);
                            console.log(`- Celdas exclusivas de ${valorActual}: ${celdasExclusivasActual.length}`);
                            console.log(`- Celdas exclusivas de ${valorAdyacente}: ${celdasExclusivasAdyacente.length}`);
                            console.log(`- Banderas adyacentes a ${valorActual}: ${banderasActual}`);
                            console.log(`- Banderas adyacentes a ${valorAdyacente}: ${banderasAdyacente}`);
                            
                            // Minas faltantes en cada número
                            const minasFaltantesActual = valorActual - banderasActual;
                            const minasFaltantesAdyacente = valorAdyacente - banderasAdyacente;
                            
                            console.log(`- Minas faltantes en ${valorActual}: ${minasFaltantesActual}`);
                            console.log(`- Minas faltantes en ${valorAdyacente}: ${minasFaltantesAdyacente}`);
                            
                            // CASO 1: Si todas las minas faltantes del actual deben estar en celdas compartidas
                            if (minasFaltantesActual > 0 && 
                                minasFaltantesActual <= celdasCompartidas.length && 
                                celdasExclusivasActual.length + minasFaltantesActual === valorActual) {
                                
                                console.log(`✅ PATRÓN ${valorActual}-${valorAdyacente}: Todas las minas de ${valorActual} deben estar en celdas compartidas`);
                                
                                // Las celdas exclusivas del adyacente son seguras (no son minas)
                                // (Esto nos daría celdas seguras, no banderas)
                            }
                            
                            // CASO 2: Si hay exactamente las mismas minas faltantes como celdas compartidas
                            if (minasFaltantesActual > 0 && 
                                minasFaltantesActual === celdasCompartidas.length && 
                                celdasExclusivasActual.length === 0) {
                                
                                console.log(`✅ PATRÓN ${valorActual}-${valorAdyacente}: Todas las ${celdasCompartidas.length} celdas compartidas son minas`);
                                
                                // Verificar contradicciones con ceros
                                const hayContradiccionConCeros = celdasCompartidas.some(c => {
                                    const adyacentes = obtenerCeldasAdyacentes(c.fila, c.columna, tamañoTablero);
                                    return adyacentes.some(adj => 
                                        estadoCeldas[adj.fila][adj.columna].descubierta && 
                                        (estadoCeldas[adj.fila][adj.columna].valor === '0' || 
                                        estadoCeldas[adj.fila][adj.columna].valor === '')
                                    );
                                });
                                
                                if (!hayContradiccionConCeros) {
                                    celdasCompartidas.forEach(c => {
                                        if (!estadoCeldas[c.fila][c.columna].tieneBandera &&
                                            !banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna) &&
                                            !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                                            
                                            console.log(`🚩 Nueva bandera en (${c.fila + 1},${c.columna + 1}) por patrón ${valorActual}-${valorAdyacente}`);
                                            nuevasBanderas.push({
                                                fila: c.fila,
                                                columna: c.columna,
                                                origen: `patrón ${valorActual}-${valorAdyacente}`,
                                                detalle: `Patrón ${valorActual}-${valorAdyacente} en (${i + 1},${j + 1}) y (${adyacente.fila + 1},${adyacente.columna + 1}), celdas compartidas son minas`
                                            });
                                            
                                            estadoCeldas[c.fila][c.columna].tieneBandera = true;
                                        }
                                    });
                                }
                            }
                            
                            // CASO 3: Todas las celdas exclusivas del número actual deben ser minas
                            if (minasFaltantesActual > 0 && 
                                minasFaltantesActual === celdasExclusivasActual.length &&
                                celdasCompartidas.length >= minasFaltantesAdyacente) {
                                
                                console.log(`✅ PATRÓN ${valorActual}-${valorAdyacente}: Todas las ${celdasExclusivasActual.length} celdas exclusivas de ${valorActual} son minas`);
                                
                                // Verificar contradicciones con ceros
                                const hayContradiccionConCeros = celdasExclusivasActual.some(c => {
                                    const adyacentes = obtenerCeldasAdyacentes(c.fila, c.columna, tamañoTablero);
                                    return adyacentes.some(adj => 
                                        estadoCeldas[adj.fila][adj.columna].descubierta && 
                                        (estadoCeldas[adj.fila][adj.columna].valor === '0' || 
                                        estadoCeldas[adj.fila][adj.columna].valor === '')
                                    );
                                });
                                
                                if (!hayContradiccionConCeros) {
                                    celdasExclusivasActual.forEach(c => {
                                        if (!estadoCeldas[c.fila][c.columna].tieneBandera &&
                                            !banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna) &&
                                            !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                                            
                                            console.log(`🚩 Nueva bandera en (${c.fila + 1},${c.columna + 1}) por patrón ${valorActual}-${valorAdyacente} exclusivas`);
                                            nuevasBanderas.push({
                                                fila: c.fila,
                                                columna: c.columna,
                                                origen: `patrón ${valorActual}-${valorAdyacente} exclusivas`,
                                                detalle: `Patrón ${valorActual}-${valorAdyacente} en (${i + 1},${j + 1}) y (${adyacente.fila + 1},${adyacente.columna + 1}), celdas exclusivas son minas`
                                            });
                                            
                                            estadoCeldas[c.fila][c.columna].tieneBandera = true;
                                        }
                                    });
                                }
                            }
                            
                            // CASO 4: Simétrico al caso 3, para el número adyacente
                            if (minasFaltantesAdyacente > 0 && 
                                minasFaltantesAdyacente === celdasExclusivasAdyacente.length &&
                                celdasCompartidas.length >= minasFaltantesActual) {
                                
                                console.log(`✅ PATRÓN ${valorActual}-${valorAdyacente}: Todas las ${celdasExclusivasAdyacente.length} celdas exclusivas de ${valorAdyacente} son minas`);
                                
                                // Verificar contradicciones con ceros
                                const hayContradiccionConCeros = celdasExclusivasAdyacente.some(c => {
                                    const adyacentes = obtenerCeldasAdyacentes(c.fila, c.columna, tamañoTablero);
                                    return adyacentes.some(adj => 
                                        estadoCeldas[adj.fila][adj.columna].descubierta && 
                                        (estadoCeldas[adj.fila][adj.columna].valor === '0' || 
                                        estadoCeldas[adj.fila][adj.columna].valor === '')
                                    );
                                });
                                
                                if (!hayContradiccionConCeros) {
                                    celdasExclusivasAdyacente.forEach(c => {
                                        if (!estadoCeldas[c.fila][c.columna].tieneBandera &&
                                            !banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna) &&
                                            !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                                            
                                            console.log(`🚩 Nueva bandera en (${c.fila + 1},${c.columna + 1}) por patrón ${valorActual}-${valorAdyacente} exclusivas`);
                                            nuevasBanderas.push({
                                                fila: c.fila,
                                                columna: c.columna,
                                                origen: `patrón ${valorActual}-${valorAdyacente} exclusivas`,
                                                detalle: `Patrón ${valorActual}-${valorAdyacente} en (${i + 1},${j + 1}) y (${adyacente.fila + 1},${adyacente.columna + 1}), celdas exclusivas son minas`
                                            });
                                            
                                            estadoCeldas[c.fila][c.columna].tieneBandera = true;
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            }
        }
    }
    
    // 3. PATRÓN ESPECÍFICO DE BORDE Y ESQUINA PARA NÚMEROS 2-8
    console.log("\nBuscando patrones específicos en bordes y esquinas:");
    
    // 3.1 Esquinas con números > 1
    const esquinas = [
        { fila: 0, columna: 0 }, // Superior izquierda
        { fila: 0, columna: columnas - 1 }, // Superior derecha
        { fila: filas - 1, columna: 0 }, // Inferior izquierda
        { fila: filas - 1, columna: columnas - 1 } // Inferior derecha
    ];
    
    esquinas.forEach(esquina => {
        // Verificar si la esquina está descubierta y tiene un valor numérico
        if (estadoCeldas[esquina.fila][esquina.columna].descubierta && 
            estadoCeldas[esquina.fila][esquina.columna].valor !== '' && 
            estadoCeldas[esquina.fila][esquina.columna].valor !== 'M' && 
            !isNaN(estadoCeldas[esquina.fila][esquina.columna].valor)) {
            
            const valor = parseInt(estadoCeldas[esquina.fila][esquina.columna].valor);
            
            // Solo analizar esquinas con valores > 1
            if (valor > 1) {
                console.log(`\n🔍 Patrón de esquina con ${valor} detectado en (${esquina.fila + 1},${esquina.columna + 1})`);
                
                // En una esquina solo hay 3 celdas adyacentes
                const adyacentes = obtenerCeldasAdyacentes(esquina.fila, esquina.columna, tamañoTablero);
                
                // Contar cuántas celdas adyacentes están ya descubiertas
                const adyacentesDescubiertas = adyacentes.filter(c => 
                    estadoCeldas[c.fila][c.columna].descubierta
                );
                
                // Contar banderas ya colocadas
                const banderasColocadas = adyacentes.filter(c => 
                    estadoCeldas[c.fila][c.columna].tieneBandera ||
                    banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna)
                ).length;
                
                console.log(`- Adyacentes descubiertas: ${adyacentesDescubiertas.length}, banderas: ${banderasColocadas}`);
                
                // Celdas sin descubrir y sin bandera
                const celdasPendientes = adyacentes.filter(c => 
                    !estadoCeldas[c.fila][c.columna].descubierta &&
                    !estadoCeldas[c.fila][c.columna].tieneBandera &&
                    !banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna)
                );
                
                // Minas faltantes
                const minasFaltantes = valor - banderasColocadas;
                
                console.log(`- Celdas pendientes: ${celdasPendientes.length}, minas faltantes: ${minasFaltantes}`);
                
                // En una esquina, si todas las celdas pendientes deben ser minas
                if (minasFaltantes > 0 && minasFaltantes === celdasPendientes.length) {
                    console.log(`✅ PATRÓN ESQUINA ${valor}: Todas las ${celdasPendientes.length} celdas pendientes son minas`);
                    
                    celdasPendientes.forEach(c => {
                        if (!nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                            console.log(`🚩 Nueva bandera en (${c.fila + 1},${c.columna + 1}) por patrón esquina ${valor}`);
                            nuevasBanderas.push({
                                fila: c.fila,
                                columna: c.columna,
                                origen: `patrón esquina ${valor}`,
                                detalle: `Patrón de esquina con valor ${valor} en (${esquina.fila + 1},${esquina.columna + 1})`
                            });
                            
                            estadoCeldas[c.fila][c.columna].tieneBandera = true;
                        }
                    });
                }
                
                // Caso especial: Esquina con valor 3
                if (valor === 3 && celdasPendientes.length === 3) {
                    console.log(`✅ PATRÓN ESQUINA 3: Todas las 3 celdas adyacentes son minas`);
                    
                    celdasPendientes.forEach(c => {
                        if (!nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                            console.log(`🚩 Nueva bandera en (${c.fila + 1},${c.columna + 1}) por patrón esquina 3`);
                            nuevasBanderas.push({
                                fila: c.fila,
                                columna: c.columna,
                                origen: 'patrón esquina 3',
                                detalle: `Esquina con valor 3 implica que todas las celdas adyacentes son minas`
                            });
                            
                            estadoCeldas[c.fila][c.columna].tieneBandera = true;
                        }
                    });
                }
            }
        }
    });
    
    // 3.2 Bordes con números específicos
    console.log("\nBuscando patrones en bordes:");
    
    // Recorrer bordes
    // Borde superior e inferior
    for (let j = 0; j < columnas; j++) {
        // Borde superior
        analizarCeldaBorde(0, j, estadoCeldas, tamañoTablero, banderasYaIdentificadas, nuevasBanderas);
        // Borde inferior
        analizarCeldaBorde(filas - 1, j, estadoCeldas, tamañoTablero, banderasYaIdentificadas, nuevasBanderas);
    }
    
    // Borde izquierdo y derecho (sin esquinas)
    for (let i = 1; i < filas - 1; i++) {
        // Borde izquierdo
        analizarCeldaBorde(i, 0, estadoCeldas, tamañoTablero, banderasYaIdentificadas, nuevasBanderas);
        // Borde derecho
        analizarCeldaBorde(i, columnas - 1, estadoCeldas, tamañoTablero, banderasYaIdentificadas, nuevasBanderas);
    }
    
    // 4. PATRÓN 1-1 ADYACENTES (busca pares de 1s adyacentes para deducir banderas)
    console.log("\nBuscando patrón 1-1 adyacentes:");
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            // Verificar si esta celda es un 1 descubierto
            if (estadoCeldas[i][j].descubierta && estadoCeldas[i][j].valor === '1') {
                const adyacentesActual = obtenerCeldasAdyacentes(i, j, tamañoTablero);
                
                // Buscar otros 1 adyacentes
                const adyacentesCon1 = adyacentesActual.filter(adj => 
                    estadoCeldas[adj.fila][adj.columna].descubierta && 
                    estadoCeldas[adj.fila][adj.columna].valor === '1'
                );
                
                if (adyacentesCon1.length > 0) {
                    // Por cada par de 1 adyacentes
                    adyacentesCon1.forEach(otro1 => {
                        // Evitar analizar el mismo par dos veces
                        if (i > otro1.fila || (i === otro1.fila && j > otro1.columna)) return;
                        
                        console.log(`\n🔍 Patrón 1-1 adyacentes detectado en (${i + 1},${j + 1}) y (${otro1.fila + 1},${otro1.columna + 1})`);
                        
                        // Obtener adyacentes del otro 1
                        const adyacentesOtro = obtenerCeldasAdyacentes(otro1.fila, otro1.columna, tamañoTablero);
                        
                        // Obtener celdas que solo pertenecen a uno de los dos 1s
                        const adyacentesSoloActual = adyacentesActual.filter(cA => 
                            !adyacentesOtro.some(cO => cA.fila === cO.fila && cA.columna === cO.columna) &&
                            !estadoCeldas[cA.fila][cA.columna].descubierta &&
                            !estadoCeldas[cA.fila][cA.columna].tieneBandera
                        );
                        
                        const adyacentesSoloOtro = adyacentesOtro.filter(cO => 
                            !adyacentesActual.some(cA => cO.fila === cA.fila && cO.columna === cA.columna) &&
                            !estadoCeldas[cO.fila][cO.columna].descubierta &&
                            !estadoCeldas[cO.fila][cO.columna].tieneBandera
                        );
                        
                        // Comprobamos las banderas ya colocadas
                        const banderasAdyacentesActual = adyacentesActual.filter(c => 
                            estadoCeldas[c.fila][c.columna].tieneBandera ||
                            banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna)
                        ).length;
                        
                        const banderasAdyacentesOtro = adyacentesOtro.filter(c => 
                            estadoCeldas[c.fila][c.columna].tieneBandera ||
                            banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna)
                        ).length;
                        
                        console.log(`- Banderas adyacentes a (${i + 1},${j + 1}): ${banderasAdyacentesActual}`);
                        console.log(`- Banderas adyacentes a (${otro1.fila + 1},${otro1.columna + 1}): ${banderasAdyacentesOtro}`);
                        
                        // Si un número 1 ya tiene su bandera y el otro no, la bandera del segundo debe estar
                        // en sus celdas exclusivas
                        if (banderasAdyacentesActual === 1 && banderasAdyacentesOtro === 0 && adyacentesSoloOtro.length === 1) {
                            const candidata = adyacentesSoloOtro[0];
                            console.log(`✅ DEDUCCIÓN: El 1 en (${otro1.fila + 1},${otro1.columna + 1}) debe tener su mina en su única celda exclusiva`);
                            
                            // Verificar contradicciones con ceros
                            const hayContradiccionConCeros = adyacentesSoloOtro.some(c => {
                                const adyacentes = obtenerCeldasAdyacentes(c.fila, c.columna, tamañoTablero);
                                return adyacentes.some(adj => 
                                    estadoCeldas[adj.fila][adj.columna].descubierta && 
                                    (estadoCeldas[adj.fila][adj.columna].valor === '0' || 
                                    estadoCeldas[adj.fila][adj.columna].valor === '')
                                );
                            });
                            
                            if (!hayContradiccionConCeros) {
                                console.log(`🚩 Nueva bandera en (${candidata.fila + 1},${candidata.columna + 1}) por patrón 1-1`);
                                nuevasBanderas.push({
                                    fila: candidata.fila,
                                    columna: candidata.columna,
                                    origen: 'patrón 1-1',
                                    detalle: `Patrón 1-1 con (${i + 1},${j + 1}) ya satisfecho, mina debe estar en celda exclusiva de (${otro1.fila + 1},${otro1.columna + 1})`
                                });
                                
                                estadoCeldas[candidata.fila][candidata.columna].tieneBandera = true;
                            }
                        }
                        // Caso simétrico
                        else if (banderasAdyacentesActual === 0 && banderasAdyacentesOtro === 1 && adyacentesSoloActual.length === 1) {
                            const candidata = adyacentesSoloActual[0];
                            console.log(`✅ DEDUCCIÓN: El 1 en (${i + 1},${j + 1}) debe tener su mina en su única celda exclusiva`);
                            
                            // Verificar contradicciones con ceros
                            const hayContradiccionConCeros = adyacentesSoloActual.some(c => {
                                const adyacentes = obtenerCeldasAdyacentes(c.fila, c.columna, tamañoTablero);
                                return adyacentes.some(adj => 
                                    estadoCeldas[adj.fila][adj.columna].descubierta && 
                                    (estadoCeldas[adj.fila][adj.columna].valor === '0' || 
                                    estadoCeldas[adj.fila][adj.columna].valor === '')
                                );
                            });
                            
                            if (!hayContradiccionConCeros) {
                                console.log(`🚩 Nueva bandera en (${candidata.fila + 1},${candidata.columna + 1}) por patrón 1-1`);
                                nuevasBanderas.push({
                                    fila: candidata.fila,
                                    columna: candidata.columna,
                                    origen: 'patrón 1-1',
                                    detalle: `Patrón 1-1 con (${otro1.fila + 1},${otro1.columna + 1}) ya satisfecho, mina debe estar en celda exclusiva de (${i + 1},${j + 1})`
                                });
                                
                                estadoCeldas[candidata.fila][candidata.columna].tieneBandera = true;
                            }
                        }
                    });
                }
            }
        }
    }
    
    console.log(`\nRESULTADO: ${nuevasBanderas.length} nuevas banderas identificadas por análisis de patrones`);
    return nuevasBanderas;
};

/**
 * Función auxiliar para analizar celdas en bordes
 * @param {number} fila - Fila de la celda en el borde
 * @param {number} columna - Columna de la celda en el borde
 * @param {Array} estadoCeldas - Estado de todas las celdas
 * @param {object} tamañoTablero - Tamaño del tablero
 * @param {Array} banderasYaIdentificadas - Banderas ya identificadas
 * @param {Array} nuevasBanderas - Array donde se añadirán nuevas banderas
 */
const analizarCeldaBorde = (fila, columna, estadoCeldas, tamañoTablero, banderasYaIdentificadas, nuevasBanderas) => {
    // Verificar si la celda de borde está descubierta y tiene un valor numérico
    if (estadoCeldas[fila][columna].descubierta && 
        estadoCeldas[fila][columna].valor !== '' && 
        estadoCeldas[fila][columna].valor !== 'M' && 
        !isNaN(estadoCeldas[fila][columna].valor)) {
        
        const valor = parseInt(estadoCeldas[fila][columna].valor);
        
        // Solo analizar bordes con valores > 1
        if (valor > 1) {
            console.log(`\n🔍 Patrón de borde con ${valor} detectado en (${fila + 1},${columna + 1})`);
            
            // En un borde hay 5 celdas adyacentes (o 3 en esquinas)
            const adyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
            
            // Contar cuántas celdas adyacentes están ya descubiertas
            const adyacentesDescubiertas = adyacentes.filter(c => 
                estadoCeldas[c.fila][c.columna].descubierta
            );
            
            // Contar banderas ya colocadas
            const banderasColocadas = adyacentes.filter(c => 
                estadoCeldas[c.fila][c.columna].tieneBandera ||
                banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna)
            ).length;
            
            console.log(`- Adyacentes: ${adyacentes.length}, descubiertas: ${adyacentesDescubiertas.length}, banderas: ${banderasColocadas}`);
            
            // Celdas sin descubrir y sin bandera
            const celdasPendientes = adyacentes.filter(c => 
                !estadoCeldas[c.fila][c.columna].descubierta &&
                !estadoCeldas[c.fila][c.columna].tieneBandera &&
                !banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna)
            );
            
            // Minas faltantes
            const minasFaltantes = valor - banderasColocadas;
            
            console.log(`- Celdas pendientes: ${celdasPendientes.length}, minas faltantes: ${minasFaltantes}`);
            
            // Si todas las celdas pendientes deben ser minas
            if (minasFaltantes > 0 && minasFaltantes === celdasPendientes.length) {
                console.log(`✅ PATRÓN BORDE ${valor}: Todas las ${celdasPendientes.length} celdas pendientes son minas`);
                
                celdasPendientes.forEach(c => {
                    if (!nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                        console.log(`🚩 Nueva bandera en (${c.fila + 1},${c.columna + 1}) por patrón borde ${valor}`);
                        nuevasBanderas.push({
                            fila: c.fila,
                            columna: c.columna,
                            origen: `patrón borde ${valor}`,
                            detalle: `Patrón de borde con valor ${valor} en (${fila + 1},${columna + 1})`
                        });
                        
                        estadoCeldas[c.fila][c.columna].tieneBandera = true;
                    }
                });
            }
            
            // Casos especiales para bordes
            // Caso 1: Borde con valor 5 (todas las celdas adyacentes son minas)
            if (valor === 5 && adyacentes.length === 5 && celdasPendientes.length === 5) {
                console.log(`✅ PATRÓN BORDE 5: Todas las 5 celdas adyacentes son minas`);
                
                celdasPendientes.forEach(c => {
                    if (!nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                        console.log(`🚩 Nueva bandera en (${c.fila + 1},${c.columna + 1}) por patrón borde 5`);
                        nuevasBanderas.push({
                            fila: c.fila,
                            columna: c.columna,
                            origen: 'patrón borde 5',
                            detalle: `Borde con valor 5 implica que todas las celdas adyacentes son minas`
                        });
                        
                        estadoCeldas[c.fila][c.columna].tieneBandera = true;
                    }
                });
            }
            
            // Caso 2: Borde con valor 4 y 4 celdas pendientes
            if (valor === 4 && celdasPendientes.length === 4) {
                console.log(`✅ PATRÓN BORDE 4: Las 4 celdas pendientes son minas`);
                
                celdasPendientes.forEach(c => {
                    if (!nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                        console.log(`🚩 Nueva bandera en (${c.fila + 1},${c.columna + 1}) por patrón borde 4`);
                        nuevasBanderas.push({
                            fila: c.fila,
                            columna: c.columna,
                            origen: 'patrón borde 4',
                            detalle: `Borde con valor 4 y exactamente 4 celdas pendientes`
                        });
                        
                        estadoCeldas[c.fila][c.columna].tieneBandera = true;
                    }
                });
            }
        }
    }
};

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
                        const celdasSegurasDe1 = adyacentesA1.filter(c1 => 
                            !adyacentesA2.some(c2 => c1.fila === c2.fila && c1.columna === c2.columna)
                        );
                        
                        const celdasSegurasDe3 = adyacentesA3.filter(c3 => 
                            !adyacentesA2.some(c2 => c3.fila === c2.fila && c3.columna === c2.columna)
                        );
                        
                        // Combinar celdas seguras de ambos 1
                        const todasCeldasSeguras = [...celdasSegurasDe1, ...celdasSegurasDe3];
                        
                        todasCeldasSeguras.forEach(c => {
                            // Verificar que no esté descubierta ni tenga bandera ya
                            if (!estadoCeldas[c.fila][c.columna].descubierta && 
                                !estadoCeldas[c.fila][c.columna].tieneBandera &&
                                !celdasSeguras.some(s => s.fila === c.fila && s.columna === c.columna)) {
                                
                                celdasSeguras.push({
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
    });
    
    return celdasSeguras;
};