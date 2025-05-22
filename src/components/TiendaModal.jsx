import { useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { getFirestore, collection, getDocs, doc, setDoc, query, where, getDoc } from 'firebase/firestore';

const TiendaModal = ({ isOpen, onClose }) => {
  const db = getFirestore();
  const [categoriaActiva, setCategoriaActiva] = useState('Jugador');
  const [cosmeticosPorTipo, setCosmeticosPorTipo] = useState({
    Jugador: [],
    Enemigo: [],
    Fondo: [],
  });
  const [adquisiciones, setAdquisiciones] = useState([]);
  const [coinCont, setCoinCont] = useState(null);
  const [mensajeError, setMensajeError] = useState('');
  const [mostrarMensajeError, setMostrarMensajeError] = useState(false); // New state for controlling visibility


  useEffect(() => {
    // Obtiene las monedas del usuario
    const obtenerMonedas = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'usuarios', currentUser.uid));
          if (userDoc.exists()) {
            setCoinCont(userDoc.data().monedas || 0);
          }
        } else {
          setCoinCont(null);
        }
      } catch (error) {
        console.error('Error al obtener las monedas del usuario:', error);
      }
    };

    // Obtiene todos los cosméticos de la colección
    const obtenerCosmeticos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'cosmeticos'));
        const datos = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id
          };
        });

        const agrupados = {
          Jugador: [],
          Enemigo: [],
          Fondo: [],
        };

        datos.forEach(item => {
          const tipo = item.tipo;
          if (agrupados[tipo] && item.imagen !== 'default') {
            agrupados[tipo].push(item);
          }
        });

        setCosmeticosPorTipo(agrupados);
      } catch (error) {
        console.error('Error al obtener cosméticos:', error);
      }
    };

    // Determina que cosméticos ya están adquiridos
    const obtenerAdquisiciones = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const adquisicionesQuery = query(
          collection(db, 'adquisiciones'),
          where('usuario', '==', user.uid)
        );
        const adquisicionesSnapshot = await getDocs(adquisicionesQuery);
        // Store the unique document IDs
        const adquiridos = adquisicionesSnapshot.docs.map(doc => doc.data().cosmetico.id);

        setAdquisiciones(adquiridos);
      } catch (error) {
        console.error('Error al obtener adquisiciones:', error);
      }
    };

    if (isOpen) {
      obtenerMonedas();
      obtenerCosmeticos();
      obtenerAdquisiciones();
    }
  }, [isOpen]);

  // Effect to manage the error message visibility and disappearance
  useEffect(() => {
    if (mensajeError) {
      setMostrarMensajeError(true);
      const timer = setTimeout(() => {
        setMostrarMensajeError(false);
        // After the transition, clear the message content
        setTimeout(() => setMensajeError(''), 1000); // 1000ms matches the CSS transition duration
      }, 3000); // Message visible for 3 seconds before fading
      return () => clearTimeout(timer);
    }
  }, [mensajeError]);

  if (!isOpen) return null;

  const user = auth.currentUser;
  const cosméticos = cosmeticosPorTipo[categoriaActiva] || [];

  // Si el usuario compra un cosmético
  const comprar = async (item) => {
  try {
    if (coinCont < item.precio) {
      setMensajeError('No tienes suficientes monedas para comprar este cosmético.');
      return; // The useEffect will handle showing and hiding the message
    }

    await setDoc(
      doc(db, 'adquisiciones', `${user.uid}_${item.id}`),
      {
        usuario: user.uid,
        cosmetico: {
          id: item.id,
          nombre: item.nombre,
          tipo: item.tipo,
          imagen: item.imagen,
          precio: item.precio,
        },
        fecha: new Date().toISOString(),
      },
      { merge: true }
    );

    const nuevasMonedas = coinCont - item.precio;
    await setDoc(
      doc(db, 'usuarios', user.uid),
      { monedas: nuevasMonedas },
      { merge: true }
    );

    setCoinCont(nuevasMonedas);
    setAdquisiciones([...adquisiciones, item.id]);
    setMensajeError(''); // Clear error on successful purchase
    setMostrarMensajeError(false); // Hide the message immediately
  } catch (error) {
    console.error('Error al realizar la compra:', error);
    setMensajeError('Ocurrió un error al procesar la compra.');
  }
};

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>✖</button>
        {user ? (
          <>
            <div className="current-user-coins">
              Monedas: {coinCont}
            </div>
            <h2 className="modal-title">Tienda de Cosméticos</h2>
            {/* Apply the class for transition */}
            <div className={`mensaje-error ${mostrarMensajeError ? 'show' : ''}`}>
              {mensajeError}
            </div>
            <nav className="modal-nav">
              {Object.keys(cosmeticosPorTipo).map((categoria) => (
                <button
                  key={categoria}
                  className={`nav-button ${categoriaActiva === categoria ? 'active' : ''}`}
                  onClick={() => setCategoriaActiva(categoria)}
                >
                  {categoria}
                </button>
              ))}
            </nav>
            <div className="cosmeticos-list">
              {cosméticos.map((item, index) => (
                <div key={index} className="cosmetico-item">
                  <img src={`/assets/${item.tipo}/${item.imagen}.png`} alt={item.nombre} className="cosmetico-img" />
                  <p>{item.nombre}</p>
                  <p>{item.precio} monedas</p>
                  {adquisiciones.includes(item.id) ? (
                    <p className="agotado-text">Agotado</p>
                  ) : (
                    <button onClick={() => comprar(item)}>Comprar</button>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p>Debes iniciar sesión para acceder a la sección de la tienda.</p>
        )}
      </div>
    </div>
  );
};

export default TiendaModal;