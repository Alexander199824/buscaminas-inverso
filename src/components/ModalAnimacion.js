import React from 'react';

const ModalAnimacion = ({ 
    mostrarModal, 
    mensajeModal, 
    tipoModal, 
    tema, 
    inicializarTablero 
}) => {
    if (!mostrarModal) return null;
    
    // Elementos visuales para la celebración cuando el sistema gana
    const renderizarFiesta = () => {
        return (
            <div className="fiesta-container">
                {/* Fila superior de bombas y confeti */}
                <div className="flex justify-around mb-3">
                    {[...Array(5)].map((_, i) => (
                        <span key={`bomb-top-${i}`} className="text-2xl animate-bounce" style={{animationDelay: `${i * 0.1}s`}}>
                            💣
                        </span>
                    ))}
                </div>
                
                {/* Filas laterales */}
                <div className="flex justify-between">
                    <div className="flex flex-col">
                        {[...Array(3)].map((_, i) => (
                            <span key={`confeti-left-${i}`} className="text-2xl animate-spin" style={{animationDelay: `${i * 0.2}s`}}>
                                🎊
                            </span>
                        ))}
                    </div>
                    
                    {/* Centro con el trofeo */}
                    <div className="text-5xl animate-pulse">
                        🏆
                    </div>
                    
                    <div className="flex flex-col">
                        {[...Array(3)].map((_, i) => (
                            <span key={`confeti-right-${i}`} className="text-2xl animate-spin" style={{animationDelay: `${i * 0.2}s`}}>
                                🎉
                            </span>
                        ))}
                    </div>
                </div>
                
                {/* Fila inferior de bombas y confeti */}
                <div className="flex justify-around mt-3">
                    {[...Array(5)].map((_, i) => (
                        <span key={`bomb-bottom-${i}`} className="text-2xl animate-bounce" style={{animationDelay: `${i * 0.1}s`}}>
                            💣
                        </span>
                    ))}
                </div>
            </div>
        );
    };
    
    return (
        <div className={`fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                 z-50 p-4 rounded-lg shadow-lg border-2 
                 ${tipoModal === 'error' ? tema.modalError :
                tipoModal === 'éxito' ? tema.modalExito :
                tipoModal === 'fiesta' ? tema.modalExito + ' animate-bounce' :
                    tema.modalAdvertencia}
                 ${tipoModal !== 'fiesta' ? 'animate-bounce' : ''} text-center max-w-md`}>
            
            {/* Mostrar celebración especial si es tipo 'fiesta' */}
            {tipoModal === 'fiesta' && renderizarFiesta()}
            
            <p className="text-xl font-bold">
                {mensajeModal}
            </p>
            
            {(tipoModal === 'error' || tipoModal === 'fiesta') && (
                <button
                    className={`px-4 py-2 mt-4 rounded ${tema.botonPrimario}`}
                    onClick={inicializarTablero}
                >
                    {tipoModal === 'fiesta' ? '¡Jugar de nuevo!' : 'Intentar de nuevo'}
                </button>
            )}
        </div>
    );
};

export default ModalAnimacion;