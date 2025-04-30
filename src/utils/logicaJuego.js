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
                    console.log(`MEMORIA: Mina conocida en (${fila}, ${columna}) - Valor normalizado: ${claveNorm}`);
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
            
            // IMPORTANTE: Si esta celda es una mina conocida, NO considerarla en absoluto
            if (minasConocidas.some(mina => mina.fila === i && mina.columna === j)) {
                console.log(`Saltando mina conocida en (${i}, ${j})`);
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
                        razonamiento.push(`Cerca de mina conocida (${mina.fila},${mina.columna})`);
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
    todasLasUbicaciones.slice(0, 5).forEach((opcion, idx) => {
        console.log(`${idx+1}. (${opcion.fila},${opcion.columna}) - Valor: ${opcion.valor}, Riesgo: ${opcion.factorRiesgo}`);
    });
    
    // Agregar algo de aleatoriedad: seleccionar entre el top 20% de opciones
    const topOpciones = Math.max(1, Math.ceil(todasLasUbicaciones.length * 0.2));
    const indiceAleatorio = Math.floor(Math.random() * topOpciones);
    
    const seleccion = todasLasUbicaciones[indiceAleatorio];
    console.log(`Seleccionada: (${seleccion.fila},${seleccion.columna}) - Valor: ${seleccion.valor}, Riesgo: ${seleccion.factorRiesgo}`);
    
    // Añadir al historial
    historialSeleccionesAleatorias.push(`${seleccion.fila},${seleccion.columna}`);
    
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
        // 1. CREAR MODELO COMPLETO DEL TABLERO
        const modeloTablero = crearModeloTablero(tablero, tamañoTablero, celdasDescubiertas, banderas);
        
        // 2. IDENTIFICAR TODAS LAS BANDERAS NUEVAS
        const nuevasBanderas = identificarTodasLasBanderas(modeloTablero);
        
        // 3. IDENTIFICAR CELDAS 100% SEGURAS
        const celdasSeguras = identificarCeldasSeguras(modeloTablero);
        
        // 4. CALCULAR PROBABILIDADES PARA TODAS LAS CELDAS
        const mapaProbabilidades = calcularProbabilidadesGlobales(modeloTablero);
        
        // 5. Enriquecer el mapa de probabilidades con la memoria histórica
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
                        origen: 'aprendizaje de partidas anteriores'
                    };
                }
            }
        }
        
        // 7. Si no hay una celda determinada por memoria, usar el análisis normal
        if (!siguienteCelda) {
            siguienteCelda = determinarMejorJugadaEnCapas(
                modeloTablero, 
                mapaProbabilidadesEnriquecido, 
                celdasSeguras, 
                historialMovimientos,
                memoriaJuego,
                tamañoTablero
            );
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
        return {
            banderas: banderas || [],
            siguienteCelda: seleccionarCeldaAleatoria(tablero, tamañoTablero, celdasDescubiertas, banderas, memoriaJuego, historialMovimientos),
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

/**
 * Encuentra celdas seguras con 100% de certeza
 * Mejorado para identificar automáticamente celdas adyacentes a ceros
 * @param {object} modeloTablero - Modelo completo del tablero
 * @returns {Array} - Lista de celdas seguras
 */
export const identificarCeldasSeguras = (modeloTablero) => {
    const { restricciones, estadoCeldas, banderas, tamañoTablero } = modeloTablero;
    const celdasSeguras = [];
    
    // NUEVA VERIFICACIÓN: Identificar específicamente celdas adyacentes a ceros
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
            } 
            else if (evaluacion.confianza === 'media') {
                // 40% memoria + 60% análisis actual
                const nuevaProbabilidad = (factorRiesgoMemoria * 0.4) + (probabilidadOriginal * 0.6);
                mapaEnriquecido[clave].probabilidad = nuevaProbabilidad;
                mapaEnriquecido[clave].origen = `${mapaEnriquecido[clave].origen} + memoria histórica`;
                mapaEnriquecido[clave].razonamientoMemoria = evaluacion.razonamiento;
            }
            // Para confianza baja, mantenemos más el análisis actual
            else {
                // 20% memoria + 80% análisis actual
                const nuevaProbabilidad = (factorRiesgoMemoria * 0.2) + (probabilidadOriginal * 0.8);
                mapaEnriquecido[clave].probabilidad = nuevaProbabilidad;
                // Solo mencionamos la memoria si aumenta significativamente el riesgo
                if (Math.abs(nuevaProbabilidad - probabilidadOriginal) > 0.1) {
                    mapaEnriquecido[clave].origen = `${mapaEnriquecido[clave].origen} + indicio histórico`;
                    mapaEnriquecido[clave].razonamientoMemoria = evaluacion.razonamiento;
                }
            }
        }
    }
    
    return mapaEnriquecido;
};

/**
 * Determina la mejor jugada utilizando un enfoque basado en capas
 * Mejorado para trabajar con todos los números del 0-8 y priorizar celdas seguras
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
        // Primero, buscar celdas seguras que sean adyacentes a ceros
        const celdasAdyacentesACero = celdasSeguras.filter(
            celda => celda.origen === 'adyacente a cero'
        );
        
        // Si hay celdas adyacentes a ceros, priorizar esas
        if (celdasAdyacentesACero.length > 0) {
            // Elegir la celda segura que esté más cerca del último movimiento
            let mejorCeldaSegura = celdasAdyacentesACero[0];
            let distanciaMinima = Number.MAX_SAFE_INTEGER;
            
            // Si hay movimientos previos, buscar la celda segura más cercana al último
            if (historialMovimientos.length > 0) {
                // Filtrar solo las selecciones (no banderas)
                const selecciones = historialMovimientos.filter(mov => !mov.esAccion);
                
                if (selecciones.length > 0) {
                    const ultimaSeleccion = selecciones[selecciones.length - 1];
                    
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
            
            return {
                fila: mejorCeldaSegura.fila,
                columna: mejorCeldaSegura.columna,
                tipoAnalisis: 'celda 100% segura (adyacente a cero)',
                origen: mejorCeldaSegura.origen
            };
        }
        
        // CAPA 1B: OTRAS CELDAS SEGURAS
        // Si no hay celdas adyacentes a ceros, usar cualquier celda segura
        let mejorCeldaSegura = celdasSeguras[0];
        let distanciaMinima = Number.MAX_SAFE_INTEGER;
        
        // Si hay movimientos previos, buscar la celda segura más cercana al último
        if (historialMovimientos.length > 0) {
            // Filtrar solo las selecciones (no banderas)
            const selecciones = historialMovimientos.filter(mov => !mov.esAccion);
            
            if (selecciones.length > 0) {
                const ultimaSeleccion = selecciones[selecciones.length - 1];
                
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
        
        return {
            fila: mejorCeldaSegura.fila,
            columna: mejorCeldaSegura.columna,
            tipoAnalisis: 'celda 100% segura',
            origen: mejorCeldaSegura.origen
        };
    }
    
    // CAPA 2: EXPLORACIÓN BASADA EN PROBABILIDAD
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
    
    // Si no hay celdas candidatas (raro), seleccionar una celda aleatoria
    if (celdasCandidatas.length === 0) {
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
    // Identificar celdas con probabilidad muy baja que pueden considerarse seguras
    const celdasMuySeguras = celdasCandidatas.filter(c => c.probabilidad < 0.05);
    if (celdasMuySeguras.length > 0) {
        // Ordenar por probabilidad ascendente (menor primero)
        celdasMuySeguras.sort((a, b) => a.probabilidad - b.probabilidad);
        // Elegir la celda con menor probabilidad
        return {
            fila: celdasMuySeguras[0].fila,
            columna: celdasMuySeguras[0].columna,
            tipoAnalisis: `probabilidad muy baja ${Math.round(celdasMuySeguras[0].probabilidad * 100)}%`,
            origen: celdasMuySeguras[0].origen,
            razonamientoMemoria: celdasMuySeguras[0].razonamientoMemoria
        };
    }
    
    // CAPA 3: ANÁLISIS POR NÚMEROS ADYACENTES
    // Clasificar las celdas según los números adyacentes
    celdasCandidatas.forEach(celda => {
        const { fila, columna } = celda;
        const celdasAdyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoTablero);
        
        // MEJORA: Análisis completo de todos los números adyacentes (del 0 al 8)
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
                celda.probabilidad *= factorRiesgo;
                
                // Bonus para números muy altos
                if (esAdyacenteAlto) {
                    celda.probabilidad *= 1.1;
                }
                
                celda.probabilidad = Math.min(0.95, celda.probabilidad);
            }
        }
    });
    
    // Dividir en celdas de frontera (adyacentes a descubiertas) y no frontera
    const celdasFrontera = celdasCandidatas.filter(c => c.maxNumeroAdyacente >= 0);
    const celdasNoFrontera = celdasCandidatas.filter(c => c.maxNumeroAdyacente === -1);
    
    // CAPA 4: ESTRATEGIA SEGÚN ETAPA DEL JUEGO
    // Determinar la etapa del juego basada en el porcentaje de celdas descubiertas
    const totalCeldas = tamañoTablero.filas * tamañoTablero.columnas;
    const porcentajeDescubierto = (modeloTablero.celdasDescubiertas.length / totalCeldas) * 100;
    
    let celdaSeleccionada = null;
    
    // Inicio del juego: Favorecer exploración en áreas distintas
    if (porcentajeDescubierto < 15) {
        // Priorizar celdas con bajo valor numérico adyacente (0-1)
        const celdasSeguras = celdasCandidatas.filter(c => 
            (c.maxNumeroAdyacente === -1 || c.maxNumeroAdyacente <= 1) && 
            c.probabilidad < 0.15
        );
        
        if (celdasSeguras.length > 0) {
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
            } else {
                // Primer movimiento, seleccionar al azar entre las seguras
                const indiceAleatorio = Math.floor(Math.random() * celdasSeguras.length);
                celdaSeleccionada = celdasSeguras[indiceAleatorio];
            }
        }
    }
    // Mitad del juego: Priorizar celdas de frontera con baja probabilidad
    else if (porcentajeDescubierto < 50) {
        // Filtrar celdas de frontera con bajo riesgo (no adyacentes a números altos)
        const celdasFronteraSeguras = celdasFrontera.filter(c => !c.esAdyacenteAlto);
        
        if (celdasFronteraSeguras.length > 0) {
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
        } else if (celdasNoFrontera.length > 0) {
            // Si no hay celdas de frontera seguras, usar celdas no frontera
            celdasNoFrontera.sort((a, b) => a.probabilidad - b.probabilidad);
            celdaSeleccionada = celdasNoFrontera[0];
        }
    }
    // Final del juego: Análisis más conservador
    else {
        // Ordenar todas las celdas por probabilidad ascendente
        celdasCandidatas.sort((a, b) => a.probabilidad - b.probabilidad);
        
        // Seleccionar la celda con menor probabilidad de mina
        celdaSeleccionada = celdasCandidatas[0];
    }
    
    // Si no se ha seleccionado ninguna celda, usar algoritmo básico
    if (!celdaSeleccionada) {
        // Ordenar por probabilidad ascendente
        celdasCandidatas.sort((a, b) => a.probabilidad - b.probabilidad);
        
        // Priorizar celdas no adyacentes a números altos (4-8)
        const celdasNoAdyacentesAlto = celdasCandidatas.filter(c => !c.esAdyacenteAlto);
        
        if (celdasNoAdyacentesAlto.length > 0) {
            celdaSeleccionada = celdasNoAdyacentesAlto[0];
        } else {
            // Si todas están adyacentes a números altos, elegir la de menor probabilidad
            celdaSeleccionada = celdasCandidatas[0];
        }
    }
    
    // Construir el resultado con información de razonamiento
    return {
        fila: celdaSeleccionada.fila,
        columna: celdaSeleccionada.columna,
        tipoAnalisis: `probabilidad ${Math.round(celdaSeleccionada.probabilidad * 100)}%`,
        origen: celdaSeleccionada.origen,
        razonamientoMemoria: celdaSeleccionada.razonamientoMemoria
    };
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
    
    // Si hay celdas disponibles, seleccionar una ponderando por su riesgo
    if (celdasDisponibles.length > 0) {
        // Ordenar por factor de riesgo (menor primero = más seguras)
        celdasDisponibles.sort((a, b) => a.factorRiesgo - b.factorRiesgo);
        
        // Seleccionar entre el 33% más seguro con algo de aleatoriedad
        const topSeguras = Math.max(1, Math.ceil(celdasDisponibles.length * 0.33));
        const indiceAleatorio = Math.floor(Math.random() * topSeguras);
        
        const seleccion = celdasDisponibles[indiceAleatorio];
        seleccion.tipoAnalisis = 'selección aleatoria ponderada';
        seleccion.origen = 'análisis aleatorio con memoria';
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
 * Analiza subconjuntos de restricciones para identificar banderas
 * @param {object} modeloTablero - Modelo del tablero
 * @param {Array} banderasYaIdentificadas - Banderas ya identificadas para no duplicar
 * @returns {Array} - Nuevas banderas descubiertas
 */
const analizarSubconjuntos = (modeloTablero, banderasYaIdentificadas) => {
    const { restricciones, estadoCeldas } = modeloTablero;
    const nuevasBanderas = [];
    
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
                
                // Si todas las celdas de la diferencia deben ser minas
                if (celdasDiferencia.length === minasDiferencia && minasDiferencia > 0) {
                    // Todas las celdas de la diferencia tienen minas
                    celdasDiferencia.forEach(c => {
                        // Verificar que no esté descubierta ni tenga bandera ya
                        if (!estadoCeldas[c.fila][c.columna].descubierta && 
                            !estadoCeldas[c.fila][c.columna].tieneBandera &&
                            !banderasYaIdentificadas.some(b => b.fila === c.fila && b.columna === c.columna) &&
                            !nuevasBanderas.some(b => b.fila === c.fila && b.columna === c.columna)) {
                            
                            nuevasBanderas.push({
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
    
    return nuevasBanderas;
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