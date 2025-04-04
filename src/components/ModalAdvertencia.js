import React from 'react';

const ModalAdvertencia = ({ 
    mostrarAdvertencia, 
    mensajeAdvertencia, 
    setMostrarAdvertencia, 
    aplicarRespuestaConInconsistencia, 
    modoValidacion, 
    cambiarModoValidacion, 
    tema 
}) => {
    if (!mostrarAdvertencia) return null;
    
    return (
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
    );
};

export default ModalAdvertencia;