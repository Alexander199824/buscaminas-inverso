import React from 'react';

const BotonAccion = ({ 
    tema, 
    juegoIniciado, 
    iniciarJuego, 
    inicializarTablero 
}) => {
    return (
        <div className="mb-6 text-center">
            {!juegoIniciado ? (
                <button
                    className={`w-full px-6 py-3 rounded-lg font-bold text-lg ${tema.botonPrimario} shadow-md hover:shadow-lg transition-all`}
                    onClick={iniciarJuego}
                >
                    Iniciar Juego
                </button>
            ) : (
                <button
                    className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg shadow-md hover:shadow-lg transition-all"
                    onClick={inicializarTablero}
                >
                    Reiniciar Juego
                </button>
            )}
        </div>
    );
};

export default BotonAccion;