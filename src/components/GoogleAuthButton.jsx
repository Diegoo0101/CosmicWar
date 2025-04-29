import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import './GoogleAuthButton.css';

const db = getFirestore(); // Inicializa Firestore

const GoogleAuthButton = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // Limpiar el listener al desmontar el componente
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Guardar el usuario en Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        nombre: user.displayName,
        email: user.email,
      },
    {merge:true});

      console.log('Usuario autenticado y guardado en Firestore:', user);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('Sesión cerrada');
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
  }

  return (
    <button onClick={handleLogin}>
      Iniciar sesión con Google
    </button>
  );
};

export default GoogleAuthButton;