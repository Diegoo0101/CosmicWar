import React from 'react';
import { Link } from 'react-router-dom';
import './ComoJugar.css';

const ComoJugar = () => {
  return (
    <div className="como-jugar-layout">
      <div className="column column-left"></div>

      <div className="column column-center">
        <div className="como-jugar-content">
          <h1>Cómo jugar</h1>
          <p>
            Unos extraterrestres se aproximan a la Tierra y tu deber es defenderla. Enfréntate a las oleadas de alienígenas mientras obtienes puntos, recolectas monedas y obtienes mejoras temporales que pueden soltar los enemigos derrotados. ¡Pero ten cuidado con el jefe del final de cada oleada!
          </p>

          <h2>Controles</h2>
          <p><b>Moverte:</b> WASD o flechas</p>
          <p><b>Ir más rápido:</b> Shift</p>
          <p><b>Disparar:</b> Espacio</p>
          <p><b>Disparo especial:</b> Z (al tener la barra de poder especial llena)</p>

          <h2>Objetos</h2>
          <p><img src="#"/>: Recolecta monedas para poder adquirir ciertos cosméticos</p>
          <p><img src="#"/>: Te permite disparar una ráfaga de cinco balas</p>
          <p><img src="#"/>: Te cura una porción de la vida</p>
          <p><img src="#"/>: Llena un tercio de la barra de poder especial. Al tenerla llena podrás hacer un disparo especial que causa daño masivo a todos los enemigos en pantalla.</p>
          <p><img src="#"/>: La velocidad de los enemigos se reduce considerablemente</p>
          <Link to="/" className="comenzar-btn">Volver</Link>
        </div>
      </div>

      <div className="column column-right"></div>
    </div>
  );
};

export default ComoJugar;
