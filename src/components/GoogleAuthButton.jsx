import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import './GoogleAuthButton.css';

// Incializa Firestore
const db = getFirestore();

const GoogleAuthButton = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, 'usuarios', user.uid);
      const userDocSnap = await getDoc(doc(db, 'usuarios', user.uid));

      if (!userDocSnap.exists()) {
        // Solo se ejecuta si el usuario NO existía antes en la colección
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

        // Añade adquisiciones predeterminadas solo en la primera vez
        const jugadorSnap = await getDoc(doc(db, 'cosmeticos', 'jugador_default'));
        if (jugadorSnap.exists()) {
          await setDoc(doc(db, 'adquisiciones', `${user.uid}_defaultJugador`), {
            usuario: user.uid,
            cosmetico: jugadorSnap.data(),
            fecha: new Date().toISOString(),
          });
        }

        const enemigoSnap = await getDoc(doc(db, 'cosmeticos', 'enemigo_default'));
        if (enemigoSnap.exists()) {
          await setDoc(doc(db, 'adquisiciones', `${user.uid}_defaultEnemigo`), {
            usuario: user.uid,
            cosmetico: enemigoSnap.data(),
            fecha: new Date().toISOString(),
          });
        }

        const fondoSnap = await getDoc(doc(db, 'cosmeticos', 'fondo_default'));
        if (fondoSnap.exists()) {
          await setDoc(doc(db, 'adquisiciones', `${user.uid}_defaultFondo`), {
            usuario: user.uid,
            cosmetico: fondoSnap.data(),
            fecha: new Date().toISOString(),
          });
        }

        console.log('Nuevo usuario creado en Firestore con valores predeterminados');
      } else {
        console.log('Usuario ya existente. No se sobreescriben valores predeterminados');
      }

      window.location.reload();

    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('Sesión cerrada');
      window.location.reload();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (user) {
    return (
      <div className="user-info">
        <img src={user.photoURL} alt="Foto de perfil" className="user-photo" referrerPolicy="no-referrer" />
        <span className="user-name">{user.displayName}</span>
        <button onClick={handleLogout} className="logout-button">X</button>
      </div>
    );
  } else {
    return (
      <button onClick={handleLogin} className="googleBtn">
        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" />
        Iniciar sesión con Google
      </button>
    );
  }
};

export default GoogleAuthButton;