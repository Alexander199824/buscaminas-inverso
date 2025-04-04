import React from 'react';

const PanelEstadisticas = ({ 
    tema, 
    tiempoJuego, 
    formatearTiempo, 
    banderas, 
    celdasDescubiertas, 
    juegoIniciado, 
    juegoTerminado 
}) => {
    return (
        <div className={`p-3 rounded border ${tema.panel} shadow-sm mb-6`}>
            <h3 className="text-lg font-semibold mb-3 text-center">Estadísticas</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-sm font-semibold mb-1">Tiempo</div>
                    <div className="text-2xl font-mono flex items-center">
                        <span className="mr-1">⏱️</span>
                        {formatearTiempo(tiempoJuego)}
                    </div>
                </div>
                <div>
                    <div className="text-sm font-semibold mb-1">Banderas</div>
                    <div className="text-2xl font-mono flex items-center">
                        <span className="mr-1">🚩</span>
                        {banderas.length}
                    </div>
                </div>
                <div>
                    <div className="text-sm font-semibold mb-1">Descubiertas</div>
                    <div className="text-2xl font-mono flex items-center">
                        <span className="mr-1">🔍</span>
                        {celdasDescubiertas.length}
                    </div>
                </div>
                <div>
                    <div className="text-sm font-semibold mb-1">Estado</div>
                    <div className="font-medium flex items-center">
                        {!juegoIniciado ? (
                            <><span className="mr-1">⏸️</span> No iniciado</>
                        ) : juegoTerminado ? (
                            <><span className="mr-1">🏁</span> Terminado</>
                        ) : (
                            <><span className="mr-1">▶️</span> En progreso</>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanelEstadisticas;