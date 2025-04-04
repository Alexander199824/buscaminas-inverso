import React, { useState, useEffect, useRef } from 'react';
import TableroJuego from './TableroJuego';
import PanelLateralIzquierdo from './PanelLateralIzquierdo';
import PanelLateralDerecho from './PanelLateralDerecho';
import ModalAnimacion from './ModalAnimacion';
import PanelRespuesta from './PanelRespuesta';
import ModalAdvertencia from './ModalAdvertencia'; // Nuevo componente para mostrar inconsistencias
import { obtenerClasesTema } from '../utils/temas';
import { analizarTableroCompleto, seleccionarSiguienteCelda } from '../utils/logicaJuego';
import { verificarConsistenciaRespuesta } from '../utils/validacionLogica';
import { TAMAÑOS_TABLERO } from '../constants/gameConfig';

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
    const [mensajeAdvertencia, setMensajeAdvertencia] = useState('');
    const [inconsistenciaDetectada, setInconsistenciaDetectada] = useState(null);
    const [modoValidacion, setModoValidacion] = useState('advertir'); // 'advertir', 'impedir', 'ignorar'
    
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

            // Configurar análisis periódico cada 3 segundos
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
            }, 1500);

            return () => clearTimeout(timeout);
        }
    }, [animacion]);

    // Efecto para controlar duración del modal
    useEffect(() => {
        if (mostrarModal) {
            const timeout = setTimeout(() => {
                setMostrarModal(false);
            }, 3000);

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
        setMensajeAdvertencia('');
        setInconsistenciaDetectada(null);

        if (intervaloTiempo) {
            clearInterval(intervaloTiempo);
            setIntervaloTiempo(null);
        }

        if (intervaloBusqueda) {
            clearInterval(intervaloBusqueda);
            setIntervaloBusqueda(null);
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
    };

    // Cambiar el modo de validación
    const cambiarModoValidacion = (modo) => {
        setModoValidacion(modo);
        setMostrarAdvertencia(false);
        
        // Si cambiamos a 'ignorar' y estamos esperando una respuesta con una inconsistencia,
        // aplicamos la respuesta automáticamente
        if (modo === 'ignorar' && inconsistenciaDetectada && esperandoRespuesta) {
            aplicarRespuestaConInconsistencia();
        }
    };

    // Aplicar una respuesta a pesar de la inconsistencia
    const aplicarRespuestaConInconsistencia = () => {
        if (!inconsistenciaDetectada || !celdaActual) return;
        
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
    // Respuesta del usuario sobre el contenido de la celda
const responderContenidoCelda = (tipo) => {
    console.log("Respondiendo contenido de celda:", tipo);
    
    if (!celdaActual || !esperandoRespuesta) {
        console.log("No se puede responder: no hay celda actual o no esperando respuesta");
        return;
    }

    const { fila, columna } = celdaActual;
    setTipoRespuesta(tipo);

    // Verificar la consistencia lógica de la respuesta - Con validación exhaustiva
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
        
        // Realizar verificación especial para exceso de banderas cerca de un número
        const hayExcesoBanderas = resultadoValidacion.contradicciones.some(
            c => c.tipo === 'exceso_minas' || c.tipo === 'exceso_banderas'
        );
        
        // Según el modo de validación
        if (modoValidacion === 'advertir') {
            setMostrarAdvertencia(true);
            setMensajeAdvertencia(resultadoValidacion.mensaje + 
                (hayExcesoBanderas ? " Este es un error común que viola las reglas básicas del Buscaminas." : ""));
            return; // Esperar a que el usuario decida
        } else if (modoValidacion === 'impedir') {
            // Mostrar advertencia pero no permitir continuar
            setMostrarAdvertencia(true);
            setMensajeAdvertencia(resultadoValidacion.mensaje + 
                (hayExcesoBanderas ? " Este es un error que viola las reglas básicas del Buscaminas y no se permite." : "") + 
                " Por favor, proporciona una respuesta lógicamente consistente.");
            return; // No permitir continuar
        }
        // Si el modo es 'ignorar', continuamos normalmente
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
                setBanderas,
                setMensajeSistema,
                setAnimacion,
                setMostrarModal,
                setMensajeModal,
                setTipoModal,
                setHistorialMovimientos,
                seleccionarSiguienteCelda: () => seleccionarSiguienteCeldaWrapper()
            });
        }, 500);

        // Seleccionar siguiente celda después de un breve retraso
        setTimeout(() => {
            if (!stateRef.current.esperandoRespuesta && !stateRef.current.juegoTerminado) {
                seleccionarSiguienteCeldaWrapper();
            }
        }, 1000);
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

            {/* Modal de advertencia de inconsistencia */}
            {mostrarAdvertencia && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto text-center border-4 border-yellow-500`}>
                        <h2 className="text-xl font-bold mb-4 text-yellow-600">¡Advertencia de Inconsistencia!</h2>
                        <p className="mb-4">{mensajeAdvertencia}</p>
                        <div className="grid grid-cols-2 gap-4">
                            {modoValidacion === 'advertir' && (
                                <>
                                    <button 
                                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                        onClick={() => setMostrarAdvertencia(false)}
                                    >
                                        Elegir otra respuesta
                                    </button>
                                    <button 
                                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                                        onClick={aplicarRespuestaConInconsistencia}
                                    >
                                        Continuar de todos modos
                                    </button>
                                </>
                            )}
                            {modoValidacion === 'impedir' && (
                                <button 
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 col-span-2"
                                    onClick={() => setMostrarAdvertencia(false)}
                                >
                                    Volver y elegir otra respuesta
                                </button>
                            )}
                        </div>
                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Modo de validación:</h3>
                            <div className="flex justify-center space-x-4">
                                <button 
                                    className={`px-3 py-1 rounded ${modoValidacion === 'advertir' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                    onClick={() => cambiarModoValidacion('advertir')}
                                >
                                    Advertir
                                </button>
                                <button 
                                    className={`px-3 py-1 rounded ${modoValidacion === 'impedir' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                    onClick={() => cambiarModoValidacion('impedir')}
                                >
                                    Impedir
                                </button>
                                <button 
                                    className={`px-3 py-1 rounded ${modoValidacion === 'ignorar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                    onClick={() => cambiarModoValidacion('ignorar')}
                                >
                                    Ignorar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                />

                <div className="w-full md:w-2/4 p-4 flex flex-col">
                    {/* IMPORTANTE: Renderizar condicionalmente el panel de respuesta */}
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
                    modoValidacion={modoValidacion}
                    cambiarModoValidacion={cambiarModoValidacion}
                />
            </div>
        </div>
    );
};

export default Buscaminas;