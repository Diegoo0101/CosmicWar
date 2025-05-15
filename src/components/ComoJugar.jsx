import { Link } from 'react-router-dom';
const ComoJugar = () => {
  return (
    <div className="como-jugar-layout">
      {/* Columna izquierda */}
      <div className="column column-left">
        <div className="inner-column inner-column-thin"></div>
        <div className="inner-column inner-column-thick"></div>
      </div>

      {/* Columna central */}
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
          <p className="object_p"><img src="assets/sprites/coin.png"/>: Recolecta monedas para poder adquirir ciertos cosméticos</p>
          <p className="object_p"><img src="assets/sprites/item_multishot.png"/>: Te permite disparar una ráfaga de cinco balas</p>
          <p className="object_p"><img src="assets/sprites/health.png"/>: Te cura una porción de la vida</p>
          <p className="object_p"><img src="assets/sprites/item_specialshot.png"/>: Llena un tercio de la barra de poder especial. Al tenerla llena podrás hacer un disparo especial que causa daño masivo a todos los enemigos en pantalla.</p>
          <p className="object_p"><img src="assets/sprites/item_stoptime.png"/>: La velocidad de los enemigos se reduce considerablemente</p>
          <Link to="/" className="volver-btn">Volver</Link>
        </div>
      </div>

      {/* Columna derecha */}
      <div className="column column-right">
        <div className="inner-column inner-column-thick"></div>
        <div className="inner-column inner-column-thin"></div>
      </div>
    </div>
  );
};

export default ComoJugar;