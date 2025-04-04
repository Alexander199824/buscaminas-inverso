import React from 'react';

const ModalAnimacion = ({ 
    mostrarModal, 
    mensajeModal, 
    tipoModal, 
    tema, 
    inicializarTablero 
}) => {
    if (!mostrarModal) return null;
    
    return (
        <div className={`fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                 z-50 p-4 rounded-lg shadow-lg border-2 
                 ${tipoModal === 'error' ? tema.modalError :
                tipoModal === 'éxito' ? tema.modalExito :
                    tema.modalAdvertencia}
                 animate-bounce text-center max-w-md`}>
            <p className="text-xl font-bold">{mensajeModal}</p>
            {tipoModal === 'error' && (
                <button
                    className={`px-4 py-2 mt-4 rounded ${tema.botonPrimario}`}
                    onClick={inicializarTablero}
                >
                    Intentar de nuevo
                </button>
            )}
        </div>
    );
};

export default ModalAnimacion;