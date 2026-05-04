import React, { useEffect, useState } from 'react';
import { getFreshIdToken } from '../services/firebaseClient';

function Progress({ goals, user }) {
  const [serverCompleted, setServerCompleted] = useState([]);
  const [loadingServer, setLoadingServer] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    const loadServerCompleted = async () => {
      if (!user) return;
      setLoadingServer(true);
      setServerError('');

      try {
        const end = new Date();
        const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // last 30 days
        const from = start.toISOString().slice(0, 10);
        const to = end.toISOString().slice(0, 10);
        const token = await getFreshIdToken(user);

        const baseUrl = process.env.REACT_APP_API_URL || ((typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname.includes('localhost'))
          ? 'http://localhost:5000'
          : '');

        const res = await fetch(`${baseUrl}/api/completed-goals?from=${from}&to=${to}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || errBody.message || `Status ${res.status}`);
        }

        const data = await res.json();
        setServerCompleted(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load completed goals from server:', err);
        setServerError(err.message || 'Не вдалося завантажити завершені цілі');
      } finally {
        setLoadingServer(false);
      }
    };

    loadServerCompleted();
  }, [user]);

  const doneCount = goals.filter((g) => g.status === 'completed').length;
  const activeCount = goals.filter((g) => g.status === 'active').length;
  const postponedCount = goals.filter((g) => g.status === 'postponed').length;
  const total = goals.length;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <>
      <p id="progress-text">📊 Виконано {percent}% цілей</p>
      <article className="progress-item">🏆 Завершено: {doneCount} із {total}</article>
      <article className="progress-item">⚡ Активних: {activeCount}</article>
      <article className="progress-item">⏸ Відкладених: {postponedCount}</article>

      <section className="progress-server">
        <h4>Завершено за останні 30 днів</h4>
        {loadingServer ? (
          <p>Завантаження...</p>
        ) : serverError ? (
          <p className="auth-message auth-error">{serverError}</p>
        ) : (
          <>
            <p>🏁 Кількість завершених: {serverCompleted.length}</p>
            <ul>
              {serverCompleted.slice(0, 10).map((g) => (
                <li key={g.id}>{g.title || g.id} — {g.completedAt ? new Date(g.completedAt).toLocaleString() : '—'}</li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}

export default Progress;