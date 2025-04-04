import React from 'react';
import HistorialMovimientos from './HistorialMovimientos';
import SelectorTamaño from './SelectorTamaño';
import BotonAccion from './BotonAccion';
import PanelEstadisticas from './PanelEstadisticas';
import SelectorValidacion from './SelectorValidacion';

const PanelLateralIzquierdo = ({
    tema,
    temaColor,
    cambiarTemaColor,
    tamañosTablero,
    tamañoSeleccionado,
    setTamañoSeleccionado,
    juegoIniciado,
    juegoTerminado,
    iniciarJuego,
    inicializarTablero,
    tiempoJuego,
    formatearTiempo,
    banderas,
    celdasDescubiertas,
    historialMovimientos,
    modoValidacion,
    cambiarModoValidacion
}) => {
    return (
        <div className={`w-full md:w-1/4 p-4 ${tema.tarjeta} md:min-h-screen`}>
            {/* Cabecera */}
            <div className={`p-3 ${tema.cabecera} flex justify-between items-center rounded-t-lg mb-4`}>
                <h1 className="text-xl font-bold">Buscaminas Inverso</h1>

                <div className="flex gap-2">
                    <button
                        className={`px-2 py-1 rounded ${temaColor === 'claro' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
                        onClick={() => cambiarTemaColor('claro')}
                    >
                        Claro
                    </button>
                    <button
                        className={`px-2 py-1 rounded ${temaColor === 'oscuro' ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'}`}
                        onClick={() => cambiarTemaColor('oscuro')}
                    >
                        Oscuro
                    </button>
                </div>
            </div>

            <p className="text-center mb-6 font-medium">
                El sistema selecciona las casillas, y tú le dices qué hay en cada una
            </p>

            {/* Selector de tamaño */}
            <SelectorTamaño 
                tema={tema}
                tamañosTablero={tamañosTablero}
                tamañoSeleccionado={tamañoSeleccionado}
                setTamañoSeleccionado={setTamañoSeleccionado}
                juegoIniciado={juegoIniciado}
            />

            {/* Selector de modo de validación */}
            <SelectorValidacion
                tema={tema}
                modoValidacion={modoValidacion}
                cambiarModoValidacion={cambiarModoValidacion}
                juegoIniciado={juegoIniciado}
            />

            {/* Botón de acción principal */}
            <BotonAccion 
                tema={tema}
                juegoIniciado={juegoIniciado}
                iniciarJuego={iniciarJuego}
                inicializarTablero={inicializarTablero}
            />

            {/* Panel de estadísticas */}
            <PanelEstadisticas 
                tema={tema}
                tiempoJuego={tiempoJuego}
                formatearTiempo={formatearTiempo}
                banderas={banderas}
                celdasDescubiertas={celdasDescubiertas}
                juegoIniciado={juegoIniciado}
                juegoTerminado={juegoTerminado}
            />

            {/* Historial de movimientos */}
            {juegoIniciado && historialMovimientos.length > 0 && (
                <HistorialMovimientos 
                    tema={tema}
                    historialMovimientos={historialMovimientos}
                />
            )}
        </div>
    );
};

export default PanelLateralIzquierdo;