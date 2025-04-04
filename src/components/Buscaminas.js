import React, { useState, useEffect, useRef } from 'react';
import TableroJuego from './TableroJuego';
import PanelLateralIzquierdo from './PanelLateralIzquierdo';
import PanelLateralDerecho from './PanelLateralDerecho';
import ModalAnimacion from './ModalAnimacion';
import PanelRespuesta from './PanelRespuesta';
import GestionInconsistencias from './GestionInconsistencias'; // Componente mejorado
import ModeloMentalVisualizador from './ModeloMentalVisualizador'; // Nuevo componente
import { obtenerClasesTema } from '../utils/temas';
import { analizarTableroCompleto, seleccionarSiguienteCelda } from '../utils/logicaJuego';
import { verificarConsistenciaRespuesta } from '../utils/validacionLogica';
import { TAMAÑOS_TABLERO, MODOS_VALIDACION, DURACION_ANIMACION, DURACION_MODAL } from '../constants/gameConfig';

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
    const [temaColor, setTemaColor] = useState('claro'); // 'oscuro', 'claro'
    const [animacion, setAnimacion] = useState(null); // Para controlar animaciones
    const [mostrarModal, setMostrarModal] = useState(false); // Para mostrar modales con animaciones
    const [mensajeModal, setMensajeModal] = useState('');
    const [tipoModal, setTipoModal] = useState(''); // 'éxito', 'error'
    const [intervaloBusqueda, setIntervaloBusqueda] = useState(null); // Para análisis periódico
    
    // Estados para la validación de inconsistencias
    const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);
    const [inconsistenciaDetectada, setInconsistenciaDetectada] = useState(null);
    const [modoValidacion, setModoValidacion] = useState(MODOS_VALIDACION.ADVERTIR);
    
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

            // Configurar análisis periódico
            const busquedaIntervalo = setInterval(() => {
                if (!stateRef.current.esperandoRespuesta && !stateRef.current.juegoTerminado) {
                    analizarTableroCompleto({
                        tablero: stateRef.current.tablero, 
                        tamañoSeleccionado: stateRef.current.tamañoSeleccionado, 
                        celdasDescubiertas: stateRef.current.celdasDescubiertas, 
                        banderas: stateRef.current.banderas, 
                        historialMovimientos: stateRef.current.historialMovimientos,
                        setBanderas,
                        setMensajeSistema,
                        setAnimacion,
                        setMostrarModal,
                        setMensajeModal,
                        setTipoModal,
                        setHistorialMovimientos,
                        seleccionarSiguienteCelda: () => seleccionarSiguienteCeldaWrapper()
                    });
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
    const inicializarTablero = () => {
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
            setEstadisticas(prev => ({
                ...prev,
                partidasJugadas: prev.partidasJugadas + 1,
                tiempoTotal: prev.tiempoTotal + tiempoJuego
            }));
        }
    };

    // Iniciar el juego
    const iniciarJuego = () => {
        setJuegoIniciado(true);

        // Elegir una casilla aleatoria como primera jugada
        const filaRandom = Math.floor(Math.random() * tamañoSeleccionado.filas);
        const columnaRandom = Math.floor(Math.random() * tamañoSeleccionado.columnas);

        seleccionarCelda(filaRandom, columnaRandom);
        setMensajeSistema(`El sistema ha seleccionado la casilla (${filaRandom + 1},${columnaRandom + 1}). ¿Qué hay en esta casilla?`);
        setAnimacion('iniciar');
        
        // Inicializar estadísticas para la partida actual
        setEstadisticas(prev => ({
            ...prev,
            movimientos: 0,
            banderasColocadas: 0,
            celdasSeguras: 0
        }));
    };

    // Wrapper para seleccionarSiguienteCelda que incluye los estados actuales
    const seleccionarSiguienteCeldaWrapper = () => {
        // Usar el stateRef para tener los valores más actualizados
        const { juegoTerminado, esperandoRespuesta, tablero, celdasDescubiertas, banderas, historialMovimientos, tamañoSeleccionado } = stateRef.current;

        seleccionarSiguienteCelda({
            juegoTerminado,
            esperandoRespuesta,
            tamañoSeleccionado,
            celdasDescubiertas,
            banderas,
            tablero,
            historialMovimientos,
            setJuegoTerminado,
            setMensajeSistema,
            setAnimacion,
            setMostrarModal,
            setMensajeModal,
            setTipoModal,
            seleccionarCelda
        });
    };

    // Sistema selecciona una celda
    const seleccionarCelda = (fila, columna) => {
        console.log(`Intentando seleccionar celda (${fila},${columna})`);

        // Verificar si el juego ha terminado
        if (stateRef.current.juegoTerminado) {
            console.log("No se puede seleccionar: juego terminado");
            return;
        }
        
        // Verificar si ya estamos esperando una respuesta
        if (stateRef.current.esperandoRespuesta) {
            console.log("No se puede seleccionar: esperando respuesta");
            return;
        }

        // Verificar si la celda ya ha sido descubierta
        if (stateRef.current.celdasDescubiertas.some(c => c.fila === fila && c.columna === columna)) {
            console.log("Celda ya descubierta, seleccionando otra...");
            seleccionarSiguienteCeldaWrapper();
            return;
        }

        // Verificar si la celda ya tiene una bandera
        if (stateRef.current.banderas.some(b => b.fila === fila && b.columna === columna)) {
            console.log("Celda con bandera, seleccionando otra...");
            seleccionarSiguienteCeldaWrapper();
            return;
        }

        console.log(`Seleccionando celda (${fila},${columna})`);
        setCeldaActual({ fila, columna });
        setEsperandoRespuesta(true);
        setAnimacion('seleccionar');
        
        // Actualizar estadísticas
        setEstadisticas(prev => ({
            ...prev,
            movimientos: prev.movimientos + 1
        }));
    };

    // Cambiar el modo de validación
    const cambiarModoValidacion = (modo) => {
        setModoValidacion(modo);
        setMostrarAdvertencia(false);
        
        // Si cambiamos a 'ignorar' y estamos esperando una respuesta con una inconsistencia,
        // aplicamos la respuesta automáticamente
        if (modo === MODOS_VALIDACION.IGNORAR && inconsistenciaDetectada && esperandoRespuesta) {
            aplicarRespuestaConInconsistencia();
        }
    };

    // Aplicar una respuesta a pesar de la inconsistencia
    const aplicarRespuestaConInconsistencia = () => {
        if (!inconsistenciaDetectada || !celdaActual) return;
        
        // Verificar si es una inconsistencia crítica que no se puede ignorar
        if (inconsistenciaDetectada.contradicciones && 
            inconsistenciaDetectada.contradicciones.length > 0 &&
            (inconsistenciaDetectada.contradicciones[0].tipo === 'exceso_minas' || 
             inconsistenciaDetectada.contradicciones[0].tipo === 'exceso_banderas')) {
            // No permitir continuar con errores críticos
            setMostrarAdvertencia(false);
            return;
        }
        
        // Continuar con la respuesta a pesar de la inconsistencia
        const { fila, columna } = celdaActual;
        const tipo = tipoRespuesta;
        
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
            inconsistente: true
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
                inconsistente: true
            }]
        };
        
        // Limpiar estado de inconsistencia
        setInconsistenciaDetectada(null);
        setMostrarAdvertencia(false);
        
        // Continuar con el juego
        setEsperandoRespuesta(false);
        stateRef.current.esperandoRespuesta = false;
        
        setAnimacion('respuesta');
        setTimeout(() => {
            if (!stateRef.current.esperandoRespuesta && !stateRef.current.juegoTerminado) {
                seleccionarSiguienteCeldaWrapper();
            }
        }, 1000);
    };

    // Respuesta del usuario sobre el contenido de la celda
    const responderContenidoCelda = (tipo) => {
        console.log("Respondiendo contenido de celda:", tipo);
        
        if (!celdaActual || !esperandoRespuesta) {
            console.log("No se puede responder: no hay celda actual o no esperando respuesta");
            return;
        }

        const { fila, columna } = celdaActual;
        setTipoRespuesta(tipo);

        // Verificar la consistencia lógica de la respuesta
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
            console.log("Inconsistencia detectada:", resultadoValidacion.mensaje);
            setInconsistenciaDetectada(resultadoValidacion);
            
            // Determinar si es una inconsistencia crítica
            const esInconsistenciaCritica = resultadoValidacion.contradicciones.some(
                c => c.tipo === 'exceso_minas' || c.tipo === 'exceso_banderas'
            );
            
            // Aplicar reglas según el modo de validación
            if (modoValidacion === MODOS_VALIDACION.ADVERTIR) {
                setMostrarAdvertencia(true);
                return; // Esperar a que el usuario decida
            } 
            else if (modoValidacion === MODOS_VALIDACION.IMPEDIR || esInconsistenciaCritica) {
                // Siempre impedimos contradicciones críticas, independientemente del modo
                setMostrarAdvertencia(true);
                return; // No permitir continuar
            }
            // Si el modo es 'ignorar' y no es crítica, continuamos normalmente
        }

        // Actualizar el tablero con la respuesta del usuario
        const nuevoTablero = [...tablero];

        if (tipo === 'vacío') {
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
            inconsistente: !resultadoValidacion.esConsistente
        }];
        setHistorialMovimientos(nuevoHistorial);

        // Actualizar estadísticas
        if (tipo === 'vacío' || !isNaN(tipo)) {
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
        } else {
            // IMPORTANTE: Desactivar esperandoRespuesta ANTES de llamar a la siguiente selección
            setEsperandoRespuesta(false);
            stateRef.current.esperandoRespuesta = false;
            
            setAnimacion('respuesta');

            // Analizar el tablero para buscar nuevos patrones
            setTimeout(() => {
                analizarTableroCompleto({
                    tablero: nuevoTablero, 
                    tamañoSeleccionado, 
                    celdasDescubiertas: nuevasCeldasDescubiertas,
                    banderas,
                    historialMovimientos: nuevoHistorial,
                    setBanderas: (nuevasBanderas) => {
                        setBanderas(nuevasBanderas);
                        // Actualizar estadística de banderas colocadas
                        setEstadisticas(prev => ({
                            ...prev,
                            banderasColocadas: nuevasBanderas.length
                        }));
                    },
                    setMensajeSistema,
                    setAnimacion,
                    setMostrarModal,
                    setMensajeModal,
                    setTipoModal,
                    setHistorialMovimientos,
                    seleccionarSiguienteCelda: () => seleccionarSiguienteCeldaWrapper()
                });
            }, 500);
        }
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

            {/* Componente mejorado de gestión de inconsistencias */}
            <GestionInconsistencias
                mostrarAdvertencia={mostrarAdvertencia}
                inconsistenciaDetectada={inconsistenciaDetectada}
                tablero={tablero}
                celdasDescubiertas={celdasDescubiertas}
                setMostrarAdvertencia={setMostrarAdvertencia}
                aplicarRespuestaConInconsistencia={aplicarRespuestaConInconsistencia}
                modoValidacion={modoValidacion}
                cambiarModoValidacion={cambiarModoValidacion}
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
                    modoValidacion={modoValidacion}
                    cambiarModoValidacion={cambiarModoValidacion}
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

                    {/* Visualizador de modelo mental (solo visible durante el juego) */}
                    {juegoIniciado && !juegoTerminado && (
                        <ModeloMentalVisualizador
                            tablero={tablero}
                            tamañoSeleccionado={tamañoSeleccionado}
                            celdasDescubiertas={celdasDescubiertas}
                            banderas={banderas}
                            celdaActual={celdaActual}
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
                    modoValidacion={modoValidacion}
                    cambiarModoValidacion={cambiarModoValidacion}
                    juegoIniciado={juegoIniciado}
                    estadisticas={estadisticas}
                />
            </div>
        </div>
    );
};

export default Buscaminas;