import React, { useState, useEffect, useRef } from 'react';
import TableroJuego from './TableroJuego';
import PanelLateralIzquierdo from './PanelLateralIzquierdo';
import PanelLateralDerecho from './PanelLateralDerecho';
import ModalAnimacion from './ModalAnimacion';
import PanelRespuesta from './PanelRespuesta';
import GestionInconsistencias from './GestionInconsistencias';
import { obtenerClasesTema } from '../utils/temas';
import {
    seleccionarPrimeraCeldaSegura,
    analizarTablero,
    obtenerCeldasAdyacentes,
    aprenderDeDerrota,
    distanciaManhattan
} from '../utils/logicaJuego';
import { 
    verificarConsistenciaRespuesta, 
    verificarConsistenciaGlobal,
    verificarPosiblesInconsistenciasFuturas
} from '../utils/validacionLogica';
import {
    inicializarMemoria,
    guardarMemoria,
    registrarMinaEncontrada,
    registrarSecuenciaPerdedora,
    registrarVictoria,
    evaluarCeldaConMemoria,
    determinarMejorSegundoMovimiento
} from '../utils/MemoriaJuego';
import { TAMAÑOS_TABLERO, DURACION_ANIMACION, DURACION_MODAL } from '../constants/gameConfig';

const Buscaminas = () => {
    // Estado del juego
    const [tamañoSeleccionado, setTamañoSeleccionado] = useState(TAMAÑOS_TABLERO[0]);
    const [tablero, setTablero] = useState([]);
    const [juegoIniciado, setJuegoIniciado] = useState(false);
    const [juegoTerminado, setJuegoTerminado] = useState(false);
    const [banderas, setBanderas] = useState([]);
    const [celdasDescubiertas, setCeldasDescubiertas] = useState([]);
    const [celdaActual, setCeldaActual] = useState(null);
    const [esperandoRespuesta, setEsperandoRespuesta] = useState(false);
    const [tipoRespuesta, setTipoRespuesta] = useState('vacío');
    const [historialMovimientos, setHistorialMovimientos] = useState([]);
    const [mensajeSistema, setMensajeSistema] = useState('');
    const [tiempoJuego, setTiempoJuego] = useState(0);
    const [intervaloTiempo, setIntervaloTiempo] = useState(null);
    const [temaColor, setTemaColor] = useState('claro');
    const [animacion, setAnimacion] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mensajeModal, setMensajeModal] = useState('');
    const [tipoModal, setTipoModal] = useState('');
    const [intervaloBusqueda, setIntervaloBusqueda] = useState(null);

    // Estados para la validación de inconsistencias
    const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);
    const [inconsistenciaDetectada, setInconsistenciaDetectada] = useState(null);

    // Estado para la memoria del juego
    const [memoriaJuego, setMemoriaJuego] = useState(inicializarMemoria());

    // Estado para las estadísticas de juego
    const [estadisticas, setEstadisticas] = useState({
        movimientos: 0,
        banderasColocadas: 0,
        celdasSeguras: 0,
        tiempoTotal: 0,
        partidasJugadas: 0,
        victorias: 0
    });

    // Refs para manejar el estado en setTimeout
    const stateRef = useRef({});

    // Cargar memoria del juego al iniciar
    useEffect(() => {
        // Actualizar estadísticas globales
        setEstadisticas(prev => ({
            ...prev,
            partidasJugadas: memoriaJuego.estadisticas?.partidasJugadas || 0,
            victorias: memoriaJuego.estadisticas?.victorias || 0,
            tiempoTotal: memoriaJuego.estadisticas?.tiempoTotal || 0
        }));
    }, []);

    // Guardar la memoria del juego cuando cambie
    useEffect(() => {
        if (memoriaJuego) {
            guardarMemoria(memoriaJuego);
        }
    }, [memoriaJuego]);

    // Mantener la referencia del estado actualizada
    useEffect(() => {
        stateRef.current = {
            juegoTerminado,
            esperandoRespuesta,
            tablero,
            celdasDescubiertas,
            banderas,
            historialMovimientos,
            tamañoSeleccionado
        };
    }, [juegoTerminado, esperandoRespuesta, tablero, celdasDescubiertas, banderas, historialMovimientos, tamañoSeleccionado]);

    // Inicializar tablero vacío según el tamaño seleccionado
    useEffect(() => {
        inicializarTablero();
    }, [tamañoSeleccionado]);

    // Efecto para el contador de tiempo y análisis periódico
    useEffect(() => {
        if (juegoIniciado && !juegoTerminado) {
            const intervalo = setInterval(() => {
                setTiempoJuego(prevTiempo => prevTiempo + 1);
            }, 1000);
            setIntervaloTiempo(intervalo);

            // Configurar análisis periódico del tablero
            const busquedaIntervalo = setInterval(() => {
                if (!stateRef.current.esperandoRespuesta && !stateRef.current.juegoTerminado) {
                    try {
                        realizarAnalisisTablero();
                    } catch (error) {
                        console.error("Error en análisis periódico:", error);
                    }
                }
            }, 3000);
            setIntervaloBusqueda(busquedaIntervalo);
        } else {
            if (intervaloTiempo) {
                clearInterval(intervaloTiempo);
            }
            if (intervaloBusqueda) {
                clearInterval(intervaloBusqueda);
            }
        }

        return () => {
            if (intervaloTiempo) {
                clearInterval(intervaloTiempo);
            }
            if (intervaloBusqueda) {
                clearInterval(intervaloBusqueda);
            }
        };
    }, [juegoIniciado, juegoTerminado]);

    // Efecto para controlar duración de animaciones
    useEffect(() => {
        if (animacion) {
            const timeout = setTimeout(() => {
                setAnimacion(null);
            }, DURACION_ANIMACION);

            return () => clearTimeout(timeout);
        }
    }, [animacion]);

    // Efecto para controlar duración del modal
    useEffect(() => {
        if (mostrarModal) {
            const timeout = setTimeout(() => {
                setMostrarModal(false);
            }, DURACION_MODAL);

            return () => clearTimeout(timeout);
        }
    }, [mostrarModal]);

    // Inicializar el tablero vacío
   // Inicializar el tablero vacío
const inicializarTablero = () => {
    console.log(`===== INICIALIZANDO TABLERO =====`);
    console.log(`Tamaño: ${tamañoSeleccionado.filas}x${tamañoSeleccionado.columnas}`);
    
    const nuevoTablero = Array(tamañoSeleccionado.filas).fill().map(() =>
        Array(tamañoSeleccionado.columnas).fill(null)
    );
    setTablero(nuevoTablero);
    setBanderas([]);
    setCeldasDescubiertas([]);
    setJuegoIniciado(false);
    setJuegoTerminado(false);
    setCeldaActual(null);
    setEsperandoRespuesta(false);
    setHistorialMovimientos([]);
    setMensajeSistema('Presiona "Iniciar Juego" para que el sistema comience a jugar.');
    setTiempoJuego(0);
    setAnimacion(null);
    setMostrarModal(false);
    setMostrarAdvertencia(false);
    setInconsistenciaDetectada(null);

    if (intervaloTiempo) {
        clearInterval(intervaloTiempo);
        setIntervaloTiempo(null);
    }

    if (intervaloBusqueda) {
        clearInterval(intervaloBusqueda);
        setIntervaloBusqueda(null);
    }

    // Actualizar estadísticas si era un juego en curso
    if (juegoIniciado) {
        console.log(`Juego anterior finalizado manualmente`);
        setEstadisticas(prev => ({
            ...prev,
            partidasJugadas: prev.partidasJugadas + 1,
            tiempoTotal: prev.tiempoTotal + tiempoJuego
        }));

        // Registrar fin de juego como perdido si estaba en curso
        try {
            if (memoriaJuego && historialMovimientos.length > 0) {
                registrarSecuenciaPerdedora(memoriaJuego, historialMovimientos, tamañoSeleccionado);
                console.log(`APRENDIZAJE: Registrando secuencia perdedora por reinicio manual`);
            }
        } catch (error) {
            console.error("Error al registrar secuencia perdedora:", error);
        }
    }
    
    console.log(`Tablero inicializado y listo para jugar`);
    console.log(`===== FIN DE INICIALIZACIÓN =====`);
};

    // Iniciar el juego - Seleccionar primera celda aleatoria
   // Iniciar el juego - Seleccionar primera celda aleatoria
const iniciarJuego = () => {
    setJuegoIniciado(true);
    console.log(`===== INICIANDO NUEVO JUEGO =====`);
    console.log(`Tablero de ${tamañoSeleccionado.filas}x${tamañoSeleccionado.columnas}`);

    try {
        // Obtener una celda inicial aleatoria garantizando variabilidad
        const celdaInicial = seleccionarPrimeraCeldaSegura(tamañoSeleccionado, memoriaJuego);

        // Verificar que la celda inicial es válida
        if (!celdaInicial || celdaInicial.fila === undefined || celdaInicial.columna === undefined) {
            console.error("Error: seleccionarPrimeraCeldaSegura retornó una celda inválida", celdaInicial);
            // En caso de error, usar una posición por defecto
            console.log(`USANDO CELDA POR DEFECTO (1,1) debido a error`);
            seleccionarCelda(0, 0);
            setMensajeSistema("El sistema ha seleccionado la primera casilla. ¿Qué hay en esta casilla?");
            return;
        }

        console.log(`PRIMER MOVIMIENTO: Seleccionando celda (${celdaInicial.fila + 1},${celdaInicial.columna + 1})`);
        if (celdaInicial.razonamiento && celdaInicial.razonamiento.length > 0) {
            console.log(`Razonamiento:`);
            celdaInicial.razonamiento.forEach(razon => console.log(`  - ${razon}`));
        }
        
        seleccionarCelda(celdaInicial.fila, celdaInicial.columna);
        setMensajeSistema(`El sistema ha seleccionado la casilla (${celdaInicial.fila + 1},${celdaInicial.columna + 1}). ¿Qué hay en esta casilla?`);
        setAnimacion('iniciar');

        // Inicializar estadísticas para la partida actual
        setEstadisticas(prev => ({
            ...prev,
            movimientos: 0,
            banderasColocadas: 0,
            celdasSeguras: 0
        }));
        
        console.log(`===== JUEGO INICIADO =====`);
    } catch (error) {
        console.error("Error al iniciar juego:", error);
        // En caso de error, seleccionar la primera celda
        console.log(`USANDO CELDA POR DEFECTO (1,1) debido a error`);
        seleccionarCelda(0, 0);
        setMensajeSistema("El sistema ha seleccionado la primera casilla. ¿Qué hay en esta casilla?");
    }
};

    // Realizar análisis del tablero para encontrar la próxima jugada
  // Realizar análisis del tablero para encontrar la próxima jugada
const realizarAnalisisTablero = () => {
    try {
        // Asegurarse de que stateRef tenga valores válidos
        const validTablero = stateRef.current.tablero || tablero;
        const validTamañoTablero = stateRef.current.tamañoSeleccionado || tamañoSeleccionado;
        const validCeldasDescubiertas = stateRef.current.celdasDescubiertas || celdasDescubiertas;
        const validBanderas = stateRef.current.banderas || banderas;
        const validHistorialMovimientos = stateRef.current.historialMovimientos || historialMovimientos;

        // Obtener el último movimiento para contexto
        let ultimoMovimiento = null;
        if (validHistorialMovimientos.length > 0) {
            ultimoMovimiento = validHistorialMovimientos[validHistorialMovimientos.length - 1];
            
            // Si el último movimiento fue una selección (no bandera), mostrar que estamos analizando con base en esa información
            if (!ultimoMovimiento.esAccion) {
                console.log(`===== ANÁLISIS BASADO EN RESPUESTA DEL USUARIO =====`);
                console.log(`Analizando tablero tras descubrir en (${ultimoMovimiento.fila + 1},${ultimoMovimiento.columna + 1}) = ${ultimoMovimiento.contenido === 'mina' ? '💣 MINA' : ultimoMovimiento.contenido === 'vacío' ? 'VACÍO' : ultimoMovimiento.contenido}`);
            }
        }

        console.log("===== INICIANDO ANÁLISIS DEL TABLERO =====");
        console.log(`Tablero ${validTamañoTablero.filas}x${validTamañoTablero.columnas} - Descubiertas: ${validCeldasDescubiertas.length} - Banderas: ${validBanderas.length}`);

        // Analizar el tablero para decidir la siguiente jugada
        const resultadoAnalisis = analizarTablero({
            tablero: validTablero,
            tamañoTablero: validTamañoTablero,
            celdasDescubiertas: validCeldasDescubiertas,
            banderas: validBanderas,
            historialMovimientos: validHistorialMovimientos,
            setMensajeSistema,
            setAnimacion,
            memoriaJuego
        });

        console.log("===== RESULTADO DEL ANÁLISIS =====");
        
        // Mostrar banderas nuevas con más detalle
        if (resultadoAnalisis.banderas && resultadoAnalisis.banderas.length > validBanderas.length) {
            const nuevasBanderas = resultadoAnalisis.banderas.slice(validBanderas.length);
            console.log(`🚩 BANDERAS IDENTIFICADAS: ${nuevasBanderas.length} nuevas banderas`);
            nuevasBanderas.forEach((bandera, idx) => {
                console.log(`  ${idx + 1}. (${bandera.fila + 1},${bandera.columna + 1}) - Razón: ${bandera.origen || 'análisis lógico'}`);
                if (bandera.explicacion) {
                    console.log(`     ${bandera.explicacion}`);
                }
            });
        } else {
            console.log(`✗ No se identificaron nuevas banderas`);
        }

        // Mostrar detalles de la próxima celda a seleccionar
        if (resultadoAnalisis.siguienteCelda) {
            const { fila, columna, tipoAnalisis, explicacion, alternativas } = resultadoAnalisis.siguienteCelda;
            console.log(`✓ PRÓXIMA ACCIÓN: Seleccionar celda (${fila + 1}, ${columna + 1})`);
            console.log(`  Tipo de análisis: ${tipoAnalisis}`);
            if (explicacion) {
                console.log(`  Razón: ${explicacion}`);
            }
            
            // Mostrar alternativas consideradas si existen
            if (alternativas && alternativas.length > 0) {
                console.log(`  Alternativas consideradas:`);
                alternativas.forEach((alt, idx) => {
                    console.log(`   - (${alt.fila + 1}, ${alt.columna + 1}) con probabilidad ${Math.round(alt.probabilidad * 100)}%`);
                });
            }
            
            setMensajeSistema(`Seleccionando casilla (${fila + 1},${columna + 1}) - ${explicacion || tipoAnalisis}`);
        } else {
            console.log(`✗ No se determinó una siguiente celda`);
            
            // Verificar si es por victoria o por otra razón
            const totalCeldas = validTamañoTablero.filas * validTamañoTablero.columnas;
            const totalMinas = validBanderas.length;
            const celdasRestantes = totalCeldas - validCeldasDescubiertas.length - totalMinas;
            
            if (celdasRestantes === 0) {
                console.log(`✓ ¡VICTORIA! Todas las celdas seguras han sido descubiertas`);
            } else {
                console.log(`? El análisis no encontró más movimientos seguros pero quedan ${celdasRestantes} celdas sin descubrir`);
            }
        }
        console.log("=====================================");

        // Actualizar banderas si se encontraron nuevas
        if (resultadoAnalisis.banderas && resultadoAnalisis.banderas.length > validBanderas.length) {
            setBanderas(resultadoAnalisis.banderas);

            // Actualizar historial con las nuevas banderas
            let nuevoHistorial = [...validHistorialMovimientos];
            if (resultadoAnalisis.movimientosGenerados && resultadoAnalisis.movimientosGenerados.length > 0) {
                resultadoAnalisis.movimientosGenerados.forEach(movimiento => {
                    if (movimiento.esAccion && movimiento.accion === "bandera") {
                        nuevoHistorial.push({
                            ...movimiento,
                            explicacion: movimiento.explicacion || "Bandera colocada"
                        });
                    }
                });
                setHistorialMovimientos(nuevoHistorial);
            }

            // Actualizar estadísticas
            setEstadisticas(prev => ({
                ...prev,
                banderasColocadas: resultadoAnalisis.banderas.length
            }));

            // Mostrar animación
            setAnimacion('bandera');
        }

        // Si hay una siguiente celda, seleccionarla después de una breve pausa
        if (resultadoAnalisis.siguienteCelda) {
            setTimeout(() => {
                try {
                    if (!stateRef.current.esperandoRespuesta && !stateRef.current.juegoTerminado) {
                        seleccionarCelda(
                            resultadoAnalisis.siguienteCelda.fila,
                            resultadoAnalisis.siguienteCelda.columna
                        );
                    }
                } catch (error) {
                    console.error("Error al seleccionar siguiente celda:", error);
                }
            }, 1000);
        } else {
            // Si no hay siguientes celdas, verificar victoria
            verificarVictoria();
        }
    } catch (error) {
        console.error("Error en análisis del tablero:", error);
        // No hacer nada más, dejemos que el juego siga su curso normal
    }
};

    // Sistema selecciona una celda
  // Sistema selecciona una celda
const seleccionarCelda = (fila, columna) => {
    try {
        // Verificar si el juego ha terminado
        if (stateRef.current.juegoTerminado) {
            return;
        }

        // Verificar si ya estamos esperando una respuesta
        if (stateRef.current.esperandoRespuesta) {
            return;
        }

        // Validar que las coordenadas son correctas
        if (fila === undefined || columna === undefined ||
            fila < 0 || columna < 0 ||
            fila >= tamañoSeleccionado.filas || columna >= tamañoSeleccionado.columnas) {
            console.error("Coordenadas de celda inválidas:", fila, columna);
            return;
        }

        // Verificar si la celda ya ha sido descubierta
        if (stateRef.current.celdasDescubiertas.some(c => c.fila === fila && c.columna === columna)) {
            console.log(`OMITIENDO SELECCIÓN: Celda (${fila + 1},${columna + 1}) ya está descubierta`);
            realizarAnalisisTablero();
            return;
        }

        // Verificar si la celda ya tiene una bandera
        if (stateRef.current.banderas.some(b => b.fila === fila && b.columna === columna)) {
            console.log(`OMITIENDO SELECCIÓN: Celda (${fila + 1},${columna + 1}) ya tiene bandera`);
            realizarAnalisisTablero();
            return;
        }

        console.log(`===== SISTEMA SELECCIONA CELDA =====`);
        console.log(`Seleccionando celda en (${fila + 1},${columna + 1})`);
        
        setCeldaActual({ fila, columna });
        setEsperandoRespuesta(true);
        setAnimacion('seleccionar');

        // Actualizar estadísticas
        setEstadisticas(prev => ({
            ...prev,
            movimientos: prev.movimientos + 1
        }));
        console.log(`ESPERANDO RESPUESTA DEL USUARIO: ¿Qué hay en la celda (${fila + 1},${columna + 1})?`);
    } catch (error) {
        console.error("Error al seleccionar celda:", error);
    }
};

    // Respuesta del usuario sobre el contenido de la celda
const responderContenidoCelda = (tipo) => {
    try {
        if (!celdaActual || !esperandoRespuesta) {
            console.log("No hay celda actual o no se espera respuesta");
            return;
        }

        const { fila, columna } = celdaActual;
        setTipoRespuesta(tipo);

        console.log(`===== RESPUESTA DEL USUARIO =====`);
        console.log(`Usuario indica en celda (${fila + 1},${columna + 1}): ${tipo === 'mina' ? '💣 MINA' : tipo === 'vacío' ? 'VACÍO' : `NÚMERO ${tipo}`}`);

        // Primera etapa - verificar si hay posibles inconsistencias futuras (advertencia preventiva)
        const advertenciasFuturas = verificarPosiblesInconsistenciasFuturas(
            fila,
            columna,
            tipo,
            tablero,
            celdasDescubiertas,
            banderas,
            tamañoSeleccionado
        );

        // Si hay advertencias futuras, mostrarlas primero (pero son solo advertencias)
        if (advertenciasFuturas.hayAdvertencia) {
            console.log(`ADVERTENCIA PREVENTIVA: ${advertenciasFuturas.mensaje}`);
            // Mostrar advertencia pero permitir continuar
            setInconsistenciaDetectada({
                esConsistente: false,
                mensaje: advertenciasFuturas.mensaje,
                contradicciones: [{ 
                    tipo: 'advertencia_preventiva', 
                    mensaje: advertenciasFuturas.mensaje 
                }],
                esPreventiva: true
            });
            setMostrarAdvertencia(true);
            return; // Detenerse aquí, esperar respuesta del usuario
        }

        // Segunda etapa - verificar la consistencia lógica de la respuesta
        const resultadoValidacion = verificarConsistenciaRespuesta(
            fila,
            columna,
            tipo,
            tablero,
            celdasDescubiertas,
            banderas,
            tamañoSeleccionado
        );

        // Si detectamos una inconsistencia
        if (!resultadoValidacion.esConsistente) {
            console.log(`INCONSISTENCIA DETECTADA: ${resultadoValidacion.mensaje}`);
            setInconsistenciaDetectada(resultadoValidacion);

            // Determinar si es una inconsistencia crítica
            const esInconsistenciaCritica = resultadoValidacion.contradicciones.some(
                c => c.tipo === 'exceso_minas' || 
                     c.tipo === 'exceso_banderas' ||
                     c.tipo === 'exceso_minas_global' ||
                     c.tipo === 'exceso_banderas_global' ||
                     c.tipo === 'exceso_minas_para_numero'
            );

            if (esInconsistenciaCritica) {
                console.log(`INCONSISTENCIA CRÍTICA: No se puede continuar`);
                setMostrarAdvertencia(true);
                return; // No permitir continuar con contradicciones críticas
            }

            // Mostrar advertencia pero permitir continuar
            setMostrarAdvertencia(true);
            return;
        }

        // Actualizar el tablero con la respuesta del usuario
        const nuevoTablero = [...tablero];
        
        if (tipo === 'vacío') {
            // 'vacío' es realmente vacío, no un 0
            nuevoTablero[fila][columna] = '';
        } else if (tipo === 'mina') {
            nuevoTablero[fila][columna] = 'M';
        } else {
            nuevoTablero[fila][columna] = tipo;
        }

        setTablero(nuevoTablero);

        // Marcar la celda como descubierta
        const nuevasCeldasDescubiertas = [...celdasDescubiertas, { fila, columna }];
        setCeldasDescubiertas(nuevasCeldasDescubiertas);

        // Añadir al historial
        const nuevoHistorial = [...historialMovimientos, {
            fila,
            columna,
            contenido: tipo,
            inconsistente: false
        }];
        setHistorialMovimientos(nuevoHistorial);

        console.log(`TABLERO ACTUALIZADO: Celda (${fila + 1},${columna + 1}) = ${tipo === 'vacío' ? 'VACÍO' : tipo === 'mina' ? 'MINA' : tipo}`);

        // Actualizar estadísticas
        if (tipo === 'vacío' || tipo === '0' || !isNaN(tipo)) {
            setEstadisticas(prev => ({
                ...prev,
                celdasSeguras: prev.celdasSeguras + 1
            }));
        }

        // IMPORTANTE: Actualizar inmediatamente el stateRef para que tenga los valores actualizados
        stateRef.current = {
            ...stateRef.current,
            tablero: nuevoTablero,
            celdasDescubiertas: nuevasCeldasDescubiertas,
            historialMovimientos: nuevoHistorial
        };

        // Verificar si el sistema ha perdido (encontró una mina)
        if (tipo === 'mina') {
            try {
                console.log(`¡VICTORIA DEL USUARIO! El sistema encontró una mina en (${fila + 1},${columna + 1})`);
                
                // Registrar la celda peligrosa en la memoria
                if (memoriaJuego) {
                    registrarMinaEncontrada(memoriaJuego, fila, columna, tamañoSeleccionado);
                    
                    // Registrar patrón de juego que llevó a la pérdida
                    registrarSecuenciaPerdedora(memoriaJuego, nuevoHistorial, tamañoSeleccionado);
                    console.log(`APRENDIZAJE: Registrando mina y secuencia perdedora en memoria`);
                }

                // Actualizar estado del juego
                setJuegoTerminado(true);
                stateRef.current.juegoTerminado = true;
                setMensajeSistema("¡BOOM! El sistema encontró una mina.");
                setAnimacion('explosion');
                setMostrarModal(true);
                setMensajeModal('¡PUM! Has ganado. El sistema encontró una mina. ¿Quieres intentar de nuevo?');
                setTipoModal('error');
                setEsperandoRespuesta(false);
                stateRef.current.esperandoRespuesta = false;

                // Actualizar estadísticas
                setEstadisticas(prev => ({
                    ...prev,
                    partidasJugadas: prev.partidasJugadas + 1,
                    victorias: prev.victorias + 1,
                    tiempoTotal: prev.tiempoTotal + tiempoJuego
                }));

                // Aprender de la derrota (actualizar historial de derrotas)
                aprenderDeDerrota({ fila, columna });
                
                console.log(`===== FIN DEL JUEGO (VICTORIA DEL USUARIO) =====`);
            } catch (error) {
                console.error("Error al procesar derrota:", error);
            }
        } else {
            // IMPORTANTE: Desactivar esperandoRespuesta ANTES de llamar a la siguiente selección
            setEsperandoRespuesta(false);
            stateRef.current.esperandoRespuesta = false;

            setAnimacion('respuesta');

            // Si es un cero, revelar automáticamente todas las celdas adyacentes
            if (tipo === '0' || tipo === 'vacío') {
                console.log(`REVELACIÓN AUTOMÁTICA: La celda (${fila + 1},${columna + 1}) es ${tipo === '0' ? '0' : 'vacía'}, todas las celdas adyacentes son seguras`);
                
                // Obtener todas las celdas adyacentes
                const celdasAdyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoSeleccionado);
                
                // Filtrar solo las que no están descubiertas ni tienen bandera
                const celdasADescubrir = celdasAdyacentes.filter(c => 
                    !nuevasCeldasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
                    !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
                );
                
                if (celdasADescubrir.length > 0) {
                    console.log(`CELDAS SEGURAS IDENTIFICADAS: ${celdasADescubrir.length} celdas adyacentes a (${fila + 1},${columna + 1})`);
                    celdasADescubrir.forEach((c, idx) => 
                        console.log(`  ${idx + 1}. (${c.fila + 1},${c.columna + 1})`)
                    );
                    
                    // Mensaje especial para indicar que se revelarán automáticamente celdas adyacentes
                    setMensajeSistema(`La celda es un ${tipo === '0' ? '0' : 'vacío'}, todas las celdas adyacentes son seguras.`);
                    
                    // Dar tiempo para que se actualice la interfaz antes de revelar
                    setTimeout(() => {
                        if (!stateRef.current.juegoTerminado) {
                            console.log(`PRÓXIMA ACCIÓN: Seleccionar automáticamente celda segura (${celdasADescubrir[0].fila + 1},${celdasADescubrir[0].columna + 1})`);
                            // Seleccionar la primera celda adyacente automáticamente
                            seleccionarCelda(celdasADescubrir[0].fila, celdasADescubrir[0].columna);
                        }
                    }, 1000);
                } else {
                    // Si no hay celdas adyacentes para descubrir, continuar análisis normal
                    console.log(`PRÓXIMA ACCIÓN: Análisis general del tablero (no hay celdas adyacentes sin descubrir)`);
                    setTimeout(() => {
                        if (!stateRef.current.juegoTerminado) {
                            realizarAnalisisTablero();
                        }
                    }, 1000);
                }
            } else {
                // Para otros valores, seguir con el análisis normal
                console.log(`PRÓXIMA ACCIÓN: Continuar con análisis general del tablero`);
                setTimeout(() => {
                    if (!stateRef.current.juegoTerminado) {
                        realizarAnalisisTablero();
                    }
                }, 1000);
            }
        }
        console.log(`===== FIN DE LA RESPUESTA DEL USUARIO =====`);
    } catch (error) {
        console.error("Error al responder contenido de celda:", error);

        // Restablecer estado en caso de error
        setEsperandoRespuesta(false);
        stateRef.current.esperandoRespuesta = false;
    }
};
    // Aplicar una respuesta a pesar de la inconsistencia
   // Aplicar una respuesta a pesar de la inconsistencia
const aplicarRespuestaConInconsistencia = () => {
    if (!inconsistenciaDetectada || !celdaActual) return;

    console.log(`===== APLICANDO RESPUESTA CON INCONSISTENCIA =====`);
    
    // Si es una advertencia preventiva, continuar con menos restricciones
    const esAdvertenciaPreventiva = inconsistenciaDetectada.esPreventiva;
    console.log(`Tipo: ${esAdvertenciaPreventiva ? 'Advertencia preventiva' : 'Inconsistencia real'}`);
    console.log(`Mensaje: ${inconsistenciaDetectada.mensaje}`);

    // Verificar si es una inconsistencia crítica que no se puede ignorar
    if (!esAdvertenciaPreventiva && inconsistenciaDetectada.contradicciones &&
        inconsistenciaDetectada.contradicciones.length > 0 &&
        (inconsistenciaDetectada.contradicciones[0].tipo === 'exceso_minas' ||
         inconsistenciaDetectada.contradicciones[0].tipo === 'exceso_banderas' ||
         inconsistenciaDetectada.contradicciones[0].tipo === 'exceso_minas_global' ||
         inconsistenciaDetectada.contradicciones[0].tipo === 'exceso_banderas_global' ||
         inconsistenciaDetectada.contradicciones[0].tipo === 'exceso_minas_para_numero')) {
        // No permitir continuar con errores críticos
        console.log(`⚠️ INCONSISTENCIA CRÍTICA: No se puede aplicar la respuesta`);
        setMostrarAdvertencia(false);
        console.log(`===== FIN DE APLICAR RESPUESTA CON INCONSISTENCIA =====`);
        return;
    }

    // Continuar con la respuesta a pesar de la inconsistencia o advertencia
    const { fila, columna } = celdaActual;
    const tipo = tipoRespuesta;

    console.log(`Aplicando respuesta en celda (${fila + 1},${columna + 1}): ${tipo === 'mina' ? '💣 MINA' : tipo === 'vacío' ? 'VACÍO' : tipo}`);
    console.log(`ADVERTENCIA: Esta respuesta crea una posible inconsistencia en el tablero`);

    // Actualizar tablero
    const nuevoTablero = [...tablero];
    if (tipo === 'vacío') {
        nuevoTablero[fila][columna] = '';
    } else if (tipo === 'mina') {
        nuevoTablero[fila][columna] = 'M';
    } else {
        nuevoTablero[fila][columna] = tipo;
    }

    // Actualizar estado
    setTablero(nuevoTablero);
    setCeldasDescubiertas([...celdasDescubiertas, { fila, columna }]);
    setHistorialMovimientos([...historialMovimientos, {
        fila,
        columna,
        contenido: tipo,
        inconsistente: !esAdvertenciaPreventiva // Marcar como inconsistente solo si no es advertencia preventiva
    }]);

    // Actualizar el stateRef
    stateRef.current = {
        ...stateRef.current,
        tablero: nuevoTablero,
        celdasDescubiertas: [...celdasDescubiertas, { fila, columna }],
        historialMovimientos: [...historialMovimientos, {
            fila,
            columna,
            contenido: tipo,
            inconsistente: !esAdvertenciaPreventiva
        }]
    };

    // Limpiar estado de inconsistencia
    setInconsistenciaDetectada(null);
    setMostrarAdvertencia(false);

    // Continuar con el juego
    setEsperandoRespuesta(false);
    stateRef.current.esperandoRespuesta = false;

    setAnimacion('respuesta');
    
    // Si es un cero, revelar automáticamente todas las celdas adyacentes
    if (tipo === '0' || tipo === 'vacío') {
        console.log(`REVELACIÓN AUTOMÁTICA: La celda es ${tipo === '0' ? '0' : 'vacía'}, todas las celdas adyacentes son seguras`);
        
        // Obtener todas las celdas adyacentes
        const celdasAdyacentes = obtenerCeldasAdyacentes(fila, columna, tamañoSeleccionado);
        
        // Filtrar solo las que no están descubiertas ni tienen bandera
        const celdasADescubrir = celdasAdyacentes.filter(c => 
            !celdasDescubiertas.some(d => d.fila === c.fila && d.columna === c.columna) &&
            !banderas.some(b => b.fila === c.fila && b.columna === c.columna)
        );
        
        if (celdasADescubrir.length > 0) {
            console.log(`Celdas seguras adyacentes: ${celdasADescubrir.length}`);
            
            setTimeout(() => {
                if (!stateRef.current.esperandoRespuesta && !stateRef.current.juegoTerminado) {
                    console.log(`PRÓXIMA ACCIÓN: Seleccionar automáticamente celda segura (${celdasADescubrir[0].fila + 1},${celdasADescubrir[0].columna + 1})`);
                    // Seleccionar la primera celda adyacente automáticamente
                    seleccionarCelda(celdasADescubrir[0].fila, celdasADescubrir[0].columna);
                }
            }, 1000);
        } else {
            console.log(`No hay celdas adyacentes para revelar automáticamente`);
            
            setTimeout(() => {
                if (!stateRef.current.esperandoRespuesta && !stateRef.current.juegoTerminado) {
                    console.log(`PRÓXIMA ACCIÓN: Continuar con análisis del tablero`);
                    realizarAnalisisTablero();
                }
            }, 1000);
        }
    } else {
        console.log(`PRÓXIMA ACCIÓN: Continuar con análisis del tablero`);
        
        setTimeout(() => {
            if (!stateRef.current.esperandoRespuesta && !stateRef.current.juegoTerminado) {
                realizarAnalisisTablero();
            }
        }, 1000);
    }
    
    console.log(`===== FIN DE APLICAR RESPUESTA CON INCONSISTENCIA =====`);
};

    // Verificar si todas las celdas seguras han sido descubiertas (victoria)
   // Verificar si todas las celdas seguras han sido descubiertas (victoria)
const verificarVictoria = () => {
    const { filas, columnas } = tamañoSeleccionado;
    const totalCeldas = filas * columnas;

    // Asumimos que solo quedan minas por descubrir
    const celdasNoDescubiertas = totalCeldas - celdasDescubiertas.length;
    const banderasColocadas = banderas.length;

    console.log(`VERIFICANDO VICTORIA: ${celdasNoDescubiertas} celdas sin descubrir, ${banderasColocadas} banderas colocadas`);

    // Si todas las celdas no descubiertas tienen banderas, es victoria
    if (celdasNoDescubiertas === banderasColocadas) {
        try {
            console.log(`¡VICTORIA DEL SISTEMA! Ha descubierto todas las celdas seguras.`);
            
            // Registrar victoria en memoria
            if (memoriaJuego) {
                registrarVictoria(memoriaJuego, historialMovimientos, tamañoSeleccionado);
                console.log(`APRENDIZAJE: Registrando patrón de victoria en memoria`);
            }

            setJuegoTerminado(true);
            stateRef.current.juegoTerminado = true;
            setMensajeSistema("¡El sistema ha descubierto todas las celdas seguras! ¡Victoria!");
            setAnimacion('victoria');
            setMostrarModal(true);
            setMensajeModal('¡Victoria! El sistema ha identificado correctamente todas las minas.');
            setTipoModal('éxito');

            // Actualizar estadísticas
            setEstadisticas(prev => ({
                ...prev,
                partidasJugadas: prev.partidasJugadas + 1,
                tiempoTotal: prev.tiempoTotal + tiempoJuego
            }));

            console.log(`===== FIN DEL JUEGO (VICTORIA DEL SISTEMA) =====`);
            return true;
        } catch (error) {
            console.error("Error al procesar victoria:", error);
        }
    } else {
        console.log(`Continúa el juego: Faltan ${celdasNoDescubiertas - banderasColocadas} celdas seguras por descubrir`);
    }

    return false;
};

    // Cambiar el tema de color
    const cambiarTemaColor = (tema) => {
        setTemaColor(tema);
    };

    const tema = obtenerClasesTema(temaColor);

    // Formatear tiempo en formato MM:SS
    const formatearTiempo = (segundos) => {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    };

    // Verificar si la celda fue actualizada recientemente para animaciones
    const estaRecienActualizada = (fila, columna, tipo) => {
        if (!animacion) return false;

        if (tipo === 'bandera') {
            return animacion === 'bandera' && banderas.some(b =>
                b.fila === fila && b.columna === columna &&
                historialMovimientos.length > 0 &&
                historialMovimientos[historialMovimientos.length - 1].esAccion &&
                historialMovimientos[historialMovimientos.length - 1].fila === fila &&
                historialMovimientos[historialMovimientos.length - 1].columna === columna
            );
        }

        if (tipo === 'explosion' || tipo === 'respuesta') {
            return animacion === tipo &&
                historialMovimientos.length > 0 &&
                !historialMovimientos[historialMovimientos.length - 1].esAccion &&
                historialMovimientos[historialMovimientos.length - 1].fila === fila &&
                historialMovimientos[historialMovimientos.length - 1].columna === columna;
        }

        return false;
    };

    return (
        <div className={`flex min-h-screen w-full ${tema.principal}`}>
            <ModalAnimacion
                mostrarModal={mostrarModal}
                mensajeModal={mensajeModal}
                tipoModal={tipoModal}
                tema={tema}
                inicializarTablero={inicializarTablero}
            />

            {/* Componente de gestión de inconsistencias */}
            <GestionInconsistencias
                mostrarAdvertencia={mostrarAdvertencia}
                inconsistenciaDetectada={inconsistenciaDetectada}
                tablero={tablero}
                celdasDescubiertas={celdasDescubiertas}
                setMostrarAdvertencia={setMostrarAdvertencia}
                aplicarRespuestaConInconsistencia={aplicarRespuestaConInconsistencia}
                tema={tema}
            />

            <div className="w-full max-w-full flex flex-col md:flex-row">
                <PanelLateralIzquierdo
                    tema={tema}
                    temaColor={temaColor}
                    cambiarTemaColor={cambiarTemaColor}
                    tamañosTablero={TAMAÑOS_TABLERO}
                    tamañoSeleccionado={tamañoSeleccionado}
                    setTamañoSeleccionado={setTamañoSeleccionado}
                    juegoIniciado={juegoIniciado}
                    juegoTerminado={juegoTerminado}
                    iniciarJuego={iniciarJuego}
                    inicializarTablero={inicializarTablero}
                    tiempoJuego={tiempoJuego}
                    formatearTiempo={formatearTiempo}
                    banderas={banderas}
                    celdasDescubiertas={celdasDescubiertas}
                    historialMovimientos={historialMovimientos}
                    estadisticas={estadisticas}
                />

                <div className="w-full md:w-2/4 p-4 flex flex-col">
                    {/* Panel de respuesta */}
                    {esperandoRespuesta && !juegoTerminado && celdaActual && !mostrarAdvertencia && (
                        <PanelRespuesta
                            celdaActual={celdaActual}
                            tipoRespuesta={tipoRespuesta}
                            responderContenidoCelda={responderContenidoCelda}
                            tema={tema}
                        />
                    )}

                    <TableroJuego
                        tablero={tablero}
                        tamañoSeleccionado={tamañoSeleccionado}
                        celdaActual={celdaActual}
                        banderas={banderas}
                        celdasDescubiertas={celdasDescubiertas}
                        animacion={animacion}
                        tema={tema}
                        estaRecienActualizada={estaRecienActualizada}
                        historialMovimientos={historialMovimientos}
                    />
                </div>

                <PanelLateralDerecho
                    tema={tema}
                    mensajeSistema={mensajeSistema}
                    juegoIniciado={juegoIniciado}
                    estadisticas={estadisticas}
                />
            </div>
        </div>
    );
};

export default Buscaminas;