import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch, onSnapshot } from 'firebase/firestore';
const db = getFirestore();
import googleIcon from '/assets/iconos/google-icon.png';
  
const GoogleAuthButton = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  
  useEffect(() => {
    let unsubscribeUserData = null;
  
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Comprueba si el usuario está autenticado nada más cargar la página
      setUser(currentUser);
      if (currentUser) {
        // Obtiene sus datos de firestore
        const userDocRef = doc(db, 'usuarios', currentUser.uid);
  
        unsubscribeUserData = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        });
      } else {
        setUserData(null);
        if (unsubscribeUserData) {
          unsubscribeUserData();
        }
      }
    });
  
    return () => {
      unsubscribeAuth();
      if (unsubscribeUserData) unsubscribeUserData();
    };
  }, []);
  
  // Maneja el login
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Ventana emergente para iniciar sesión
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Obtiene el documento de firestore del usuario que ha iniciado sesión
      const userDocRef = doc(db, 'usuarios', user.uid);
      const userDocSnap = await getDoc(doc(db, 'usuarios', user.uid));

      // Si no existe el documento
      if (!userDocSnap.exists()) {
        // Crea un nuevo documento con datos del usuario y valores predeterminados
        await setDoc(userDocRef, {
          id: user.uid,
          nombre: user.displayName,
          email: user.email,
          playerSkin_seleccionado: 'default',
          enemySkin_seleccionado: 'default',
          background_seleccionado: 'default',
          monedas: 0,
          puntuacion: 0
        });

        // Añade como adquisiciones los cosméticos por defecto
        // Cosmético por defecto del jugador
        const jugadorSnap = await getDoc(doc(db, 'cosmeticos', 'jugador_default'));
        if (jugadorSnap.exists()) {
          await setDoc(doc(db, 'adquisiciones', `${user.uid}_defaultJugador`), {
            usuario: user.uid,
            cosmetico: jugadorSnap.data(),
            fecha: new Date().toISOString(),
          });
        }
        // Cosmético por defecto del enemigo
        const enemigoSnap = await getDoc(doc(db, 'cosmeticos', 'enemigo_default'));
        if (enemigoSnap.exists()) {
          await setDoc(doc(db, 'adquisiciones', `${user.uid}_defaultEnemigo`), {
            usuario: user.uid,
            cosmetico: enemigoSnap.data(),
            fecha: new Date().toISOString(),
          });
        }
        // Cosmético por defecto del fondo
        const fondoSnap = await getDoc(doc(db, 'cosmeticos', 'fondo_default'));
        if (fondoSnap.exists()) {
          await setDoc(doc(db, 'adquisiciones', `${user.uid}_defaultFondo`), {
            usuario: user.uid,
            cosmetico: fondoSnap.data(),
            fecha: new Date().toISOString(),
          });
        }
      }

      window.location.reload();
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  }
  
  // Maneja el logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };
  
  // Maneja la eliminación del usuario
  const handleDeleteUser = async () => {
    if (user) {
      try {
        // Recoge documento del usuario
        const userDocRef = doc(db, 'usuarios', user.uid);
  
        // Recoge las adquisiciones relacionadas con el usuario
        const adquisicionesQuery = query(
          collection(db, 'adquisiciones'),
          where('usuario', '==', user.uid)
        );
        const adquisicionesSnapshot = await getDocs(adquisicionesQuery);

        // Elimina las adquisiciones del usuario
        const batch = writeBatch(db);
        adquisicionesSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
  
        // Elimina el documento del usuario
        await deleteDoc(userDocRef);
        // Cierra sesión
        handleLogout();
      } catch (error) {
        console.error('Error al eliminar el usuario y sus adquisiciones:', error);
      }
    }
  };

  if (user) {
    // Ha iniciado sesión
    return (
      <div className="user-info">
        {/*Se muestra foto y nombre de usuario*/}
        <div
          className="user-header"
          onClick={() => setMenuVisible(!menuVisible)}
        >
          <img src={user.photoURL} alt="Foto de perfil" className="user-photo" referrerPolicy="no-referrer" />
          <span className="user-name">{user.displayName}</span>
        </div>
        {/*Si se hace clic se abré el perfil, mostrando más información y botón de eliminar usuario*/}
        {menuVisible && (
          <div className="user-menu">
            <img src={user.photoURL} alt="Foto de perfil" className="user-photo-large" referrerPolicy="no-referrer" />
            <p className="user-name-large">{user.displayName}</p>
            <p className="user-coins">Monedas: {userData?.monedas || 0}</p>
            <p className="user-score">Puntuación: {userData?.puntuacion || 0}</p>
            <button className="delete-button" onClick={handleDeleteUser}>
              Eliminar usuario
            </button>
          </div>
        )}
        {/*Botón de cerrar sesión*/}
        <button onClick={handleLogout} className="logout-button">✖</button>
      </div>
    );
  } else {
    // No ha iniciado sesión, muestra el botón de Google
    return (
      <button onClick={handleLogin} className="googleBtn">
        <img src={googleIcon} alt="Google Logo" />
        Iniciar sesión con Google
      </button>
    );
  }
};
  
export default GoogleAuthButton;