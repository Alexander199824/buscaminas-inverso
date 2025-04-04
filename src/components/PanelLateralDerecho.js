import React from 'react';

const PanelLateralDerecho = ({ tema, mensajeSistema, modoValidacion }) => {
    return (
        <div className={`w-full md:w-1/4 p-4 ${tema.tarjeta} md:min-h-screen`}>
            <div className={`p-3 rounded border ${tema.panel} shadow-sm mb-6`}>
                <h3 className="text-lg font-semibold mb-2">Mensaje del sistema</h3>
                <div className="font-medium" dangerouslySetInnerHTML={{ __html: mensajeSistema }}></div>
            </div>

            <div className={`p-4 border rounded ${tema.panel} mt-6`}>
                <h2 className="text-lg font-semibold mb-2">Instrucciones:</h2>
                <ol className="list-decimal pl-5">
                    <li>El sistema (IA) selecciona una casilla del tablero para descubrir.</li>
                    <li>Tú debes indicar qué hay en esa casilla: vacío, un número (1-8) o una mina.</li>
                    <li>Los números indican cuántas minas hay alrededor de esa casilla.</li>
                    <li>El sistema utilizará esta información para decidir su siguiente movimiento.</li>
                    <li>El sistema colocará banderas 🚩 donde cree que hay minas.</li>
                    <li>El juego termina cuando el sistema encuentra una mina o descubre todas las casillas sin minas.</li>
                    <li>Crea un mapa mental o en papel para recordar dónde colocaste las minas.</li>
                </ol>
            </div>

            <div className={`p-4 border rounded ${tema.panel} mt-6`}>
                <h2 className="text-lg font-semibold mb-2">Validación Lógica:</h2>
                <p className="mb-2">
                    El juego ahora verifica la consistencia lógica de tus respuestas. 
                    Un número en una casilla debe ser igual a la cantidad de minas en las 8 casillas adyacentes.
                </p>
                
                <p className="mb-2">
                    <strong>Modo actual:</strong> {' '}
                    <span className={`px-2 py-1 rounded ${
                        modoValidacion === 'advertir' ? 'bg-yellow-100 text-yellow-800' :
                        modoValidacion === 'impedir' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {modoValidacion === 'advertir' ? 'Advertir' :
                         modoValidacion === 'impedir' ? 'Impedir' :
                         'Ignorar'}
                    </span>
                </p>
                
                <div className="text-sm text-gray-700">
                    <p className="mb-1">
                        • <strong>Advertir:</strong> Te muestra un aviso si hay una inconsistencia, pero te permite continuar.
                    </p>
                    <p className="mb-1">
                        • <strong>Impedir:</strong> No permite respuestas que creen inconsistencias lógicas.
                    </p>
                    <p className="mb-1">
                        • <strong>Ignorar:</strong> No realiza ninguna validación lógica.
                    </p>
                </div>
                
                <div className="mt-2 flex items-center">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <span className="text-sm text-gray-700">
                        Las celdas inconsistentes se marcarán con este símbolo.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PanelLateralDerecho;