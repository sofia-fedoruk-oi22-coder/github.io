import React, { useEffect, useMemo, useState } from 'react';
import GoalCard from '../components/GoalCard';
import Progress from '../components/Progress';
import Community from '../components/Community';
import useGoals from '../hooks/useGoals';
import { getFreshIdToken } from '../services/firebaseClient';

const DAILY_REMINDER_KEY = 'daily-goals-reminder-date';

function Home({ user }) {
  const {
    goals,
    loadingGoals,
    goalsError,
    createGoal,
    updateGoal,
  } = useGoals(user);

  const [filterStatus, setFilterStatus] = useState('all');
  const [showCommunity, setShowCommunity] = useState(true);
  const [reminderInfo, setReminderInfo] = useState('⏰ Нагадування надсилається 1 раз на добу.');
  const [newGoal, setNewGoal] = useState({
    title: '',
    deadline: '',
    motivation: '',
    image: '',
    stepsText: '',
  });
  const [serverMessage, setServerMessage] = useState('');
  const [protectedData, setProtectedData] = useState(null);
  const [protectedError, setProtectedError] = useState('');

  const filteredGoals = useMemo(() => {
    if (filterStatus === 'all') {
      return goals;
    }
    return goals.filter((goal) => goal.status === filterStatus);
  }, [goals, filterStatus]);

  useEffect(() => {
    const runDailyReminder = () => {
      const today = new Date().toISOString().slice(0, 10);
      const lastReminderDate = localStorage.getItem(DAILY_REMINDER_KEY);

      if (lastReminderDate !== today) {
        console.log('⏰ Щоденне нагадування: не забувай про свої цілі!');
        alert('🔥 Нагадування дня: зроби хоча б один крок до своєї цілі!');
        localStorage.setItem(DAILY_REMINDER_KEY, today);
        setReminderInfo('✅ Сьогоднішнє нагадування вже надіслано.');
        return;
      }

      setReminderInfo('✅ Сьогоднішнє нагадування вже надіслано. Наступне — завтра.');
    };

    runDailyReminder();
    const dailyCheck = setInterval(runDailyReminder, 60 * 60 * 1000);

    return () => clearInterval(dailyCheck);
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/message')
      .then((response) => response.json())
      .then((data) => setServerMessage(data.message))
      .catch((err) => {
        console.error('Failed to fetch /api/message', err);
        setServerMessage("Не вдалося зв'язатися з сервером");
      });
  }, []);

  const fetchProtected = async () => {
    setProtectedError('');
    setProtectedData(null);
    if (!user) {
      setProtectedError('Користувач не автентифікований');
      return;
    }

    try {
      const token = await getFreshIdToken(user);
      const res = await fetch('http://localhost:5000/api/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Помилка: ${res.status}`);
      }
      const data = await res.json();
      setProtectedData(data);
    } catch (err) {
      console.error('Failed to fetch protected route', err);
      setProtectedError(err.message || 'Не вдалося отримати захищені дані');
    }
  };

  const handleStatusChange = async (id, status) => {
    if (status === 'completed') {
      await updateGoal(id, {
        status,
        steps: goals
          .find((goal) => goal.id === id)
          ?.steps.map((step) => ({ ...step, done: true })) || [],
      });
    } else {
      await updateGoal(id, { status });
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewGoal((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!newGoal.title.trim()) {
      return;
    }

    const steps = (newGoal.stepsText || '')
      .split('\n')
      .map((step) => step.trim())
      .filter(Boolean)
      .map((step) => ({ text: step, done: false }));

    if (steps.length === 0) {
      steps.push(
        { text: 'Крок 1', done: false },
        { text: 'Крок 2', done: false },
        { text: 'Крок 3', done: false }
      );
    }

    await createGoal({
      title: newGoal.title.trim(),
      deadline: newGoal.deadline,
      motivation: newGoal.motivation.trim() || 'Кожен крок наближає до результату.',
      image: newGoal.image.trim() || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600',
      steps,
    });

    setNewGoal({
      title: '',
      deadline: '',
      motivation: '',
      image: '',
      stepsText: '',
    });
  };

  const scrollToSection = (event, sectionId) => {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main>
      <nav className="section-nav">
        <ul>
          <li><a href="#goals" onClick={(event) => scrollToSection(event, 'goals')}>Мої цілі</a></li>
          <li><a href="#add-goal" onClick={(event) => scrollToSection(event, 'add-goal')}>Додати ціль</a></li>
          <li><a href="#progress" onClick={(event) => scrollToSection(event, 'progress')}>Прогрес</a></li>
          <li><a href="#community" onClick={(event) => scrollToSection(event, 'community')}>Спільнота</a></li>
        </ul>
      </nav>

      {serverMessage ? (
        <section id="backend-message">
          <p className="server-message">Сервер: {serverMessage}</p>
        </section>
      ) : null}

      <section id="protected-api">
        <h3>Захищені дані</h3>
        {user ? (
          <>
            <button className="btn-submit" type="button" onClick={fetchProtected}>Запитати захищені дані</button>
            {protectedError ? <p className="auth-message auth-error">{protectedError}</p> : null}
            {protectedData ? (
              <pre className="server-response">{JSON.stringify(protectedData, null, 2)}</pre>
            ) : null}
          </>
        ) : (
          <p>Увійдіть, щоб побачити захищені дані.</p>
        )}
      </section>

      <section id="goals">
        <h2>Мої цілі</h2>
        <p>Створюй цілі, встановлюй дедлайни та відстежуй свій шлях до успіху.</p>

        {goalsError ? (
          <p className="auth-message auth-error">{goalsError}</p>
        ) : null}

        {loadingGoals ? (
          <p>Завантаження цілей...</p>
        ) : (
          <>
            <div className="filter-controls">
              <button className="btn-submit" type="button" onClick={() => setFilterStatus('all')}>Усі</button>
              <button className="btn-submit" type="button" onClick={() => setFilterStatus('active')}>Активні</button>
              <button className="btn-submit" type="button" onClick={() => setFilterStatus('completed')}>Завершені</button>
              <button className="btn-submit" type="button" onClick={() => setFilterStatus('postponed')}>Відкладені</button>
            </div>

            <ul className="goals-grid goals-list">
              {filteredGoals.map((goal) => (
                <li className="goal-list-item" key={goal.id}>
                  <GoalCard goal={goal} onStatusChange={handleStatusChange} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section id="add-goal">
        <h2>Додати ціль</h2>
        <p>Опишіть нову ціль і створіть чіткий план дій для її досягнення.</p>
        <form className="goal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="goal-title">Назва цілі:</label>
            <input
              id="goal-title"
              name="title"
              type="text"
              value={newGoal.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="goal-deadline">Дедлайн:</label>
            <input
              id="goal-deadline"
              name="deadline"
              type="date"
              value={newGoal.deadline}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="goal-motivation">Мотивація:</label>
            <textarea
              id="goal-motivation"
              name="motivation"
              rows="3"
              value={newGoal.motivation}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="goal-image">Посилання на картинку:</label>
            <input
              id="goal-image"
              name="image"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={newGoal.image}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="goal-steps">Кроки виконання (кожен крок з нового рядка):</label>
            <textarea
              id="goal-steps"
              name="stepsText"
              rows="4"
              placeholder={'Наприклад:\nОновити резюме\nПройти 3 тренувальні співбесіди\nПодати 10 заявок'}
              value={newGoal.stepsText}
              onChange={handleInputChange}
            />
          </div>

          <button className="btn-submit" type="submit">Зберегти ціль</button>
        </form>
      </section>

      <section id="progress">
        <h2>Прогрес</h2>
        <Progress goals={goals} />
        <p>{reminderInfo}</p>
      </section>

      <button
        id="toggle-community"
        className="btn-submit community-toggle"
        type="button"
        onClick={() => setShowCommunity((prev) => !prev)}
      >
        Показати / приховати спільноту
      </button>

      <section id="community" style={{ display: showCommunity ? 'block' : 'none' }}>
        <h2>Спільнота</h2>
        <Community />
      </section>
    </main>
  );
}

export default Home;