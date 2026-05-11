import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { firestoreDb } from '../services/firebaseClient';

const statusLabel = {
  active: 'Активна',
  completed: 'Завершена',
  postponed: 'Відкладена',
};

function getDisplayName(profile) {
  return profile.name || profile.displayName || profile.email || 'Користувач';
}

function Community({ user, goToAuth }) {
  const { uid } = useParams();
  const [users, setUsers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCommunity = async () => {
      if (!user || !firestoreDb) {
        setUsers([]);
        setGoals([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const usersSnapshot = await getDocs(collection(firestoreDb, 'users'));
        const loadedUsers = usersSnapshot.docs.map((docSnapshot) => ({
          uid: docSnapshot.id,
          ...docSnapshot.data(),
        }));

        const goalsSnapshot = uid
          ? await getDocs(query(collection(firestoreDb, 'goals'), where('createdBy', '==', uid)))
          : await getDocs(collection(firestoreDb, 'goals'));

        const loadedGoals = goalsSnapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }));

        setUsers(loadedUsers);
        setGoals(loadedGoals);
      } catch (loadError) {
        console.error('Failed to load community:', loadError);
        setError(loadError.message || 'Не вдалося завантажити спільноту.');
      } finally {
        setLoading(false);
      }
    };

    loadCommunity();
  }, [user, uid]);

  const selectedUser = useMemo(
    () => users.find((item) => item.uid === uid),
    [users, uid]
  );

  const userStats = useMemo(() => {
    const stats = new Map();
    users.forEach((profile) => {
      stats.set(profile.uid, {
        total: 0,
        completed: 0,
        active: 0,
      });
    });

    goals.forEach((goal) => {
      const current = stats.get(goal.createdBy) || { total: 0, completed: 0, active: 0 };
      current.total += 1;
      if (goal.status === 'completed') current.completed += 1;
      if (goal.status === 'active') current.active += 1;
      stats.set(goal.createdBy, current);
    });

    return stats;
  }, [users, goals]);

  if (!user) {
    return (
      <main>
        <section>
          <h2>Спільнота</h2>
          <div className="goal-form guest-auth-card">
            <p>Увійдіть або зареєструйтеся, щоб переглядати профілі учасників спільноти.</p>
            <div className="guest-auth-actions">
              <button className="btn-submit" type="button" onClick={() => goToAuth('login')}>Увійти</button>
              <button className="btn-submit" type="button" onClick={() => goToAuth('register')}>Зареєструватися</button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main>
        <section>
          <h2>Спільнота</h2>
          <p>Завантаження учасників...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <section>
          <h2>Спільнота</h2>
          <p className="auth-message auth-error">{error}</p>
        </section>
      </main>
    );
  }

  if (uid) {
    const profileGoals = goals.filter((goal) => goal.createdBy === uid);
    const completedCount = profileGoals.filter((goal) => goal.status === 'completed').length;

    return (
      <main>
        <section>
          <Link className="btn-submit community-back-link" to="/community">Назад до спільноти</Link>
          <h2>{selectedUser ? getDisplayName(selectedUser) : 'Профіль користувача'}</h2>
          {selectedUser?.email ? <p><strong>Email:</strong> {selectedUser.email}</p> : null}
          {selectedUser?.age ? <p><strong>Вік:</strong> {selectedUser.age}</p> : null}

          <div className="community-stats">
            <article className="progress-item">🏆 Досягнення: {completedCount}</article>
            <article className="progress-item">🎯 Усього цілей: {profileGoals.length}</article>
          </div>

          <h3>Цілі користувача</h3>
          {profileGoals.length ? (
            <ul className="goals-grid goals-list">
              {profileGoals.map((goal) => (
                <li className="goal-list-item" key={goal.id}>
                  <article className={`goal-card ${goal.status === 'completed' ? 'goal-card-completed' : ''}`}>
                    <img src={goal.image} alt={goal.title} />
                    <h3>{goal.title}</h3>
                    <p><strong>Мотивація:</strong> {goal.motivation}</p>
                    <p><strong>Статус:</strong> <span className={`status-chip status-${goal.status}`}>{statusLabel[goal.status] || goal.status}</span></p>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <p>У цього користувача ще немає цілей.</p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main>
      <section>
        <h2>Спільнота</h2>
        <p>Переглядайте профілі інших учасників, їхні цілі та досягнення.</p>

        {users.length ? (
          <div className="community-list">
            {users.map((profile) => {
              const stats = userStats.get(profile.uid) || { total: 0, completed: 0, active: 0 };

              return (
                <Link className="comment community-user-card" to={`/community/${profile.uid}`} key={profile.uid}>
                  <h4>{getDisplayName(profile)}</h4>
                  <p>{profile.email || 'Без email'}</p>
                  <div className="community-user-meta">
                    <span>Цілей: {stats.total}</span>
                    <span>Досягнень: {stats.completed}</span>
                    <span>Активних: {stats.active}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p>У спільноті ще немає користувачів.</p>
        )}
      </section>
    </main>
  );
}

export default Community;
