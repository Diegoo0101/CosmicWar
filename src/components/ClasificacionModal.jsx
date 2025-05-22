import { useEffect, useState } from 'react';
import { getFirestore, collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase/config';
const db = getFirestore();

const ClasificacionModal = ({ isOpen, onClose }) => {
  const [topUsers, setTopUsers] = useState([]);
  const [currentUserScore, setCurrentUserScore] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchLeaderboard = async () => {
      try {
        // Obtiene los 10 jugadores con mayor puntuación
        const leaderboardQuery = query(
          collection(db, 'usuarios'),
          orderBy('puntuacion', 'desc'),
          limit(10)
        );
        const querySnapshot = await getDocs(leaderboardQuery);

        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTopUsers(usersData);

        // También obtener puntuación del usuario logueado
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'usuarios', currentUser.uid));
          if (userDoc.exists()) {
            setCurrentUserScore(userDoc.data().puntuacion || 0);
          }
        } else {
          setCurrentUserScore(null);
        }
      } catch (error) {
        console.error('Error al cargar tabla de clasificación:', error);
      }
    };

    fetchLeaderboard();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>✖</button>
        <h2 className="modal-title">Tabla de Clasificación</h2>
        <ul className="leaderboard-list">
          {topUsers.map((user, index) => (
            <li key={user.id}>
              {index + 1}. {user.nombre || 'Anónimo'} - {user.puntuacion || 0} puntos
            </li>
          ))}
        </ul>
        {currentUserScore !== null && (
          <div className="current-user-score">
            Tu puntuación: {currentUserScore} puntos
          </div>
        )}
      </div>
    </div>
  );
};

export default ClasificacionModal;
