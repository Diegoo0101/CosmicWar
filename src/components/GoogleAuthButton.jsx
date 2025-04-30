import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
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