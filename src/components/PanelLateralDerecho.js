import React from 'react';

const PanelLateralDerecho = ({ tema, mensajeSistema, juegoIniciado }) => {
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
                    <li>Tú debes indicar qué hay en esa casilla: vacío/0, un número (1-8) o una mina.</li>
                    <li>Los números indican cuántas minas hay alrededor de esa casilla.</li>
                    <li>El sistema utilizará esta información para decidir su siguiente movimiento.</li>
                    <li>El sistema colocará banderas 🚩 donde cree que hay minas.</li>
                    <li>El juego termina cuando el sistema encuentra una mina o descubre todas las casillas sin minas.</li>
                    <li>Crea un mapa mental o en papel para recordar dónde colocaste las minas.</li>
                </ol>
            </div>

            <div className={`p-4 border rounded ${tema.panel} mt-6`}>
                <h2 className="text-lg font-semibold mb-2">Reglas del buscaminas:</h2>
                <ul className="list-disc pl-5">
                    <li>Cada número indica exactamente cuántas minas hay en las 8 casillas adyacentes.</li>
                    <li>Un 0 (o vacío) significa que no hay minas alrededor.</li>
                    <li>El tablero debe ser consistente en todo momento - los números deben corresponder exactamente con las minas colocadas.</li>
                    <li>Si el sistema detecta inconsistencias, te lo notificará.</li>
                    <li>El sistema tratará de resolver el tablero usando estrategias lógicas y probabilidades.</li>
                </ul>
                
                <div className="mt-4 text-sm">
                    <p className="font-semibold">Rango de valores posibles:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                        <span className="px-2 py-1 bg-gray-100 rounded">Vacío</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">0</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">1</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">2</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">3</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">4</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">5</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">6</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">7</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">8</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">Mina 💣</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanelLateralDerecho;