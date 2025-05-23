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
        const datos = querySnapshot.docs.map(doc => doc.data());

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
        const adquiridos = adquisicionesSnapshot.docs.map(doc => doc.data().cosmetico.nombre);

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

  if (!isOpen) return null;

  const user = auth.currentUser;
  const cosméticos = cosmeticosPorTipo[categoriaActiva] || [];

  // Si el usuario compra un cosmético
  const comprar = async (item) => {
    try {
      if (coinCont < item.precio) {
        alert('No tienes suficientes monedas para comprar este cosmético.');
        return;
      }
  
      // Actualiza las adquisiciones
      await setDoc(
        doc(db, 'adquisiciones', `${user.uid}_${item.nombre}`),
        {
          usuario: user.uid,
          cosmetico: item,
          fecha: new Date().toISOString(),
        },
        { merge: true }
      );
  
      // Resta las monedas del usuario
      const nuevasMonedas = coinCont - item.precio;
      await setDoc(
        doc(db, 'usuarios', user.uid),
        { monedas: nuevasMonedas },
        { merge: true }
      );
  
      // Actualiza el estado local
      setCoinCont(nuevasMonedas);
      setAdquisiciones([...adquisiciones, item.nombre]);
    } catch (error) {
      console.error('Error al realizar la compra:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>X</button>
        {user ? (
          <>
            <div className="current-user-coins">
              Monedas: {coinCont}
            </div>
            <h2 className="modal-title">Tienda de Cosméticos</h2>
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
                  {adquisiciones.includes(item.nombre) ? (
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