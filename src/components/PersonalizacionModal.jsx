import { useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { getFirestore, collection, getDocs, query, where,  doc, updateDoc  } from 'firebase/firestore';

const PersonalizacionModal = ({ isOpen, onClose }) => {
  const db = getFirestore();
  const [categoriaActiva, setCategoriaActiva] = useState('Jugador');
  const [cosmeticosPorTipo, setCosmeticosPorTipo] = useState({
    Jugador: [],
    Enemigo: [],
    Fondo: [],
  });
  const [seleccionActual, setSeleccionActual] = useState({
    Jugador: '',
    Enemigo: '',
    Fondo: '',
  });

  const [cosmeticoCambiado, setCosmeticoCambiado] = useState(false);

  useEffect(() => {
    // Obtiene todos los cosméticos que tenga adquiridos el usuario
    const obtenerCosmeticos = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error('El usuario no está autenticado.');
          return;
        }
    
        // Obtener selección actual
        const userDoc = await getDocs(query(collection(db, 'usuarios'), where('__name__', '==', user.uid)));
        const userData = userDoc.docs[0]?.data();
        setSeleccionActual({
          Jugador: userData?.playerSkin_seleccionado || '',
          Enemigo: userData?.enemySkin_seleccionado || '',
          Fondo: userData?.background_seleccionado || '',
        });
    
        // Adquisiciones
        const adquisicionesQuery = query(
          collection(db, 'adquisiciones'),
          where('usuario', '==', user.uid)
        );
        const adquisicionesSnapshot = await getDocs(adquisicionesQuery);
        const cosmeticosAdquiridos = adquisicionesSnapshot.docs.map(doc => doc.data().cosmetico);
    
        const cosmeticosSnapshot = await getDocs(collection(db, 'cosmeticos'));
        const todosLosCosmeticos = cosmeticosSnapshot.docs.map(doc => doc.data());
    
        const agrupados = { Jugador: [], Enemigo: [], Fondo: [] };
    
        todosLosCosmeticos.forEach(item => {
          const tipo = item.tipo;
          if (agrupados[tipo] && cosmeticosAdquiridos.some(c => c.nombre === item.nombre && c.tipo === item.tipo)) {
            agrupados[tipo].push(item);
          }
        });
    
        setCosmeticosPorTipo(agrupados);
      } catch (error) {
        console.error('Error al obtener cosméticos:', error);
      }
    };
    

    if (isOpen) {
      obtenerCosmeticos();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const user = auth.currentUser;
  const cosméticos = cosmeticosPorTipo[categoriaActiva] || [];

  const seleccionar = async (item) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('Usuario no autenticado');
        return;
      }

      setCosmeticoCambiado(true);
  
      // Determinar el campo a actualizar según el tipo
      let campo;
      switch (item.tipo) {
        case 'Jugador':
          campo = 'playerSkin_seleccionado';
          break;
        case 'Enemigo':
          campo = 'enemySkin_seleccionado';
          break;
        case 'Fondo':
          campo = 'background_seleccionado';
          break;
        default:
          console.error('Tipo de cosmético no reconocido:', item.tipo);
          return;
      }
  
      // Actualiza el campo en el documento del usuario
      await updateDoc(doc(db, 'usuarios', user.uid), {
        [campo]: item.imagen
      });
  
      setSeleccionActual(prev => ({
        ...prev,
        [item.tipo]: item.imagen
      }));
    } catch (error) {
      console.error('Error al seleccionar cosmético:', error);
    }
  };

  const handleClose = () => {
    if (cosmeticoCambiado === true) {
      onClose();
      window.location.reload();
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={handleClose}>X</button>
        {user ? (
          <>
            <h2 className="modal-title">Personalización</h2>
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
                  {seleccionActual[categoriaActiva] === item.imagen ? (
                    <p className="seleccionado-texto">Seleccionado</p>
                  ) : (
                    <button onClick={() => seleccionar(item)}>Seleccionar</button>
                  )}

                </div>
              ))}
            </div>
          </>
        ) : (
          <p>Debes iniciar sesión para acceder a la sección de personalización</p>
        )}
      </div>
    </div>
  );
};

export default PersonalizacionModal;