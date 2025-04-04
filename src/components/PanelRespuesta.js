import React, { useEffect } from 'react';

const PanelRespuesta = ({ 
    celdaActual, 
    tipoRespuesta, 
    responderContenidoCelda, 
    tema 
}) => {
    // Añadir depuración para verificar cuando el componente se renderiza y con qué props
    useEffect(() => {
        console.log("PanelRespuesta renderizado con celdaActual:", celdaActual);
    }, [celdaActual]);

    if (!celdaActual) {
        console.warn("PanelRespuesta: No hay celda actual!");
        return null;
    }

    // Forzar renderizado en una capa superior con alto z-index para asegurar visibilidad
    return (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded shadow-inner animate-pulse z-50 relative">
            <p className="mb-3 text-center font-bold text-lg">
                ¿Qué hay en la casilla ({celdaActual.fila + 1},{celdaActual.columna + 1})?
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
                <button
                    className={`px-3 py-2 border rounded font-medium ${tipoRespuesta === 'vacío' ? tema.botonSeleccionado : tema.botonSecundario}`}
                    onClick={() => responderContenidoCelda('vacío')}
                >
                    Vacío
                </button>
                <button
                    className={`px-3 py-2 border rounded font-medium ${tipoRespuesta === 'mina' ? tema.botonSeleccionado : tema.botonSecundario}`}
                    onClick={() => responderContenidoCelda('mina')}
                >
                    Mina 💣
                </button>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <button
                        key={num}
                        className={`px-3 py-2 border rounded font-medium w-10 h-10 flex items-center justify-center ${tipoRespuesta === num.toString() ? tema.botonSeleccionado : tema.botonSecundario}`}
                        onClick={() => responderContenidoCelda(num.toString())}
                    >
                        {num}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PanelRespuesta;