import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { firestoreDb, getFreshIdToken } from '../services/firebaseClient';

// API base URL: prefer deploy-time env var, otherwise detect localhost for dev
const apiBase = process.env.REACT_APP_API_URL || (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname.includes('localhost') ? 'http://localhost:5000' : '');

export default function useGoals(user) {
  const [goals, setGoals] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [goalsError, setGoalsError] = useState('');

  // Завантажувати цілі користувача
  useEffect(() => {
    if (!user || !firestoreDb) {
      setGoals([]);
      setLoadingGoals(false);
      return;
    }

    const loadUserGoals = async () => {
      try {
        setLoadingGoals(true);
        setGoalsError('');

        // Отримати документ користувача
        const userRef = doc(firestoreDb, 'users', user.uid);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
          setGoals([]);
          setLoadingGoals(false);
          return;
        }

        const userData = userSnapshot.data();
        const goalsIds = userData.goalsIds || [];

        if (goalsIds.length === 0) {
          setGoals([]);
          setLoadingGoals(false);
          return;
        }

        // Завантажити дані для кожної цілі
        const goalsData = await Promise.all(
          goalsIds.map(async (goalId) => {
            try {
              const goalRef = doc(firestoreDb, 'goals', goalId);
              const goalSnapshot = await getDoc(goalRef);
              if (goalSnapshot.exists()) {
                return {
                  id: goalId,
                  ...goalSnapshot.data(),
                };
              }
              return null;
            } catch (error) {
              console.error(`Failed to load goal ${goalId}:`, error);
              return null;
            }
          })
        );

        // Отфільтрувати null значення
        const validGoals = goalsData.filter((goal) => goal !== null);
        setGoals(validGoals);
      } catch (error) {
        console.error('Failed to load goals:', error);
        setGoalsError(error.message || 'Не вдалося завантажити цілі.');
      } finally {
        setLoadingGoals(false);
      }
    };

    loadUserGoals();
  }, [user]);

  // Створити нову ціль
  const createGoal = async (goalData) => {
    if (!user || !firestoreDb) {
      setGoalsError('Користувач не авторизований.');
      return null;
    }

    try {
      // Генеруємо ID для цілі
      const goalId = doc(collection(firestoreDb, 'goals')).id;

      const newGoal = {
        title: goalData.title || '',
        deadline: goalData.deadline || 'Без дедлайну',
        motivation: goalData.motivation || 'Кожен крок наближає до результату.',
        status: 'active',
        image: goalData.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600',
        steps: goalData.steps || [],
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Зберегти ціль у глобальну колекцію
      await setDoc(doc(firestoreDb, 'goals', goalId), newGoal);

      // Додати ID цілі до списку користувача
      const userRef = doc(firestoreDb, 'users', user.uid);
      await updateDoc(userRef, {
        goalsIds: arrayUnion(goalId),
      });

      // Додати ціль в локальний стан
      const createdGoal = {
        id: goalId,
        ...newGoal,
      };
      setGoals((prevGoals) => [...prevGoals, createdGoal]);

      return createdGoal;
    } catch (error) {
      console.error('Failed to create goal:', error);
      setGoalsError(error.message || 'Не вдалося створити ціль.');
      return null;
    }
  };

  // Оновити ціль
  const updateGoal = async (goalId, updates) => {
    if (!user || !firestoreDb) {
      setGoalsError('Користувач не авторизований.');
      return false;
    }

    try {
      // If marking as completed, try server-side endpoint first (records server timestamp)
      if (updates && updates.status === 'completed') {
        try {
          const token = await getFreshIdToken(user);
          const res = await fetch(`${apiBase}/api/goals/${goalId}/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          });

          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.error || errBody.message || `Server response ${res.status}`);
          }

          const updated = await res.json();

          // Update local state with server result
          setGoals((prevGoals) =>
            prevGoals.map((g) => (g.id === goalId ? { ...g, ...updated } : g))
          );

          return true;
        } catch (serverErr) {
          console.error('Server complete endpoint failed, falling back to client update:', serverErr);
          // fall through to client-side update
        }
      }

      const goalRef = doc(firestoreDb, 'goals', goalId);

      // Перевірити, що це автор цілі
      const goalSnapshot = await getDoc(goalRef);
      if (!goalSnapshot.exists() || goalSnapshot.data().createdBy !== user.uid) {
        setGoalsError('У вас немає прав для редагування цієї цілі.');
        return false;
      }

      // Оновити ціль (client-side fallback)
      await updateDoc(goalRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // Оновити локальний стан
      setGoals((prevGoals) =>
        prevGoals.map((goal) =>
          goal.id === goalId
            ? {
              ...goal,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
            : goal
        )
      );

      return true;
    } catch (error) {
      console.error('Failed to update goal:', error);
      setGoalsError(error.message || 'Не вдалося оновити ціль.');
      return false;
    }
  };

  // Видалити ціль
  const deleteGoal = async (goalId) => {
    if (!user || !firestoreDb) {
      setGoalsError('Користувач не авторизований.');
      return false;
    }

    try {
      const goalRef = doc(firestoreDb, 'goals', goalId);

      // Перевірити, що це автор цілі
      const goalSnapshot = await getDoc(goalRef);
      if (!goalSnapshot.exists() || goalSnapshot.data().createdBy !== user.uid) {
        setGoalsError('У вас немає прав для видалення цієї цілі.');
        return false;
      }

      // Видалити ціль
      await deleteDoc(goalRef);

      // Видалити ID цілі зі списку користувача
      const userRef = doc(firestoreDb, 'users', user.uid);
      await updateDoc(userRef, {
        goalsIds: arrayRemove(goalId),
      });

      // Оновити локальний стан
      setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== goalId));

      return true;
    } catch (error) {
      console.error('Failed to delete goal:', error);
      setGoalsError(error.message || 'Не вдалося видалити ціль.');
      return false;
    }
  };

  // Затримати/відновити ціль
  const pauseGoal = async (goalId, isPaused) => {
    return updateGoal(goalId, { status: isPaused ? 'active' : 'postponed' });
  };

  // Завершити ціль
  const completeGoal = async (goalId) => {
    return updateGoal(goalId, { status: 'completed' });
  };

  return {
    goals,
    loadingGoals,
    goalsError,
    createGoal,
    updateGoal,
    deleteGoal,
    pauseGoal,
    completeGoal,
  };
}
