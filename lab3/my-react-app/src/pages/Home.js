import React, { useEffect, useMemo, useState } from 'react';
import GoalCard from '../components/GoalCard';
import Progress from '../components/Progress';
import Community from '../components/Community';

const DAILY_REMINDER_KEY = 'daily-goals-reminder-date';

function Home({ goals, setGoals }) {
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

  const handleStatusChange = (id, status) => {
    setGoals(
      goals.map((goal) => {
        if (goal.id !== id) {
          return goal;
        }

        if (status === 'completed') {
          return {
            ...goal,
            status,
            steps: goal.steps.map((step) => ({ ...step, done: true })),
          };
        }

        return { ...goal, status };
      })
    );
  };

  const handleToggleStep = (goalId, stepIndex) => {
    setGoals(
      goals.map((goal) => {
        if (goal.id !== goalId) {
          return goal;
        }

        const updatedSteps = goal.steps.map((step, index) => {
          if (index !== stepIndex) {
            return step;
          }

          return { ...step, done: !step.done };
        });

        const allDone = updatedSteps.every((step) => step.done);

        return {
          ...goal,
          steps: updatedSteps,
          status: allDone ? 'completed' : goal.status === 'completed' ? 'active' : goal.status,
        };
      })
    );
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewGoal((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!newGoal.title.trim()) {
      return;
    }

    const createdGoal = {
      id: Date.now(),
      icon: '🎯',
      title: newGoal.title.trim(),
      deadline: newGoal.deadline || 'Без дедлайну',
      motivation: newGoal.motivation.trim() || 'Кожен крок наближає до результату.',
      status: 'active',
      image:
        newGoal.image.trim() ||
        'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600',
      steps: (newGoal.stepsText || '')
        .split('\n')
        .map((step) => step.trim())
        .filter(Boolean)
        .map((step) => ({ text: step, done: false })),
    };

    if (!createdGoal.steps.length) {
      createdGoal.steps = [
        { text: 'Крок 1', done: false },
        { text: 'Крок 2', done: false },
        { text: 'Крок 3', done: false },
      ];
    }

    setGoals([createdGoal, ...goals]);
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

      <section id="goals">
        <h2>Мої цілі</h2>
        <p>Створюй цілі, встановлюй дедлайни та відстежуй свій шлях до успіху.</p>

        <div className="filter-controls">
          <button className="btn-submit" type="button" onClick={() => setFilterStatus('all')}>Усі</button>
          <button className="btn-submit" type="button" onClick={() => setFilterStatus('active')}>Активні</button>
          <button className="btn-submit" type="button" onClick={() => setFilterStatus('completed')}>Завершені</button>
          <button className="btn-submit" type="button" onClick={() => setFilterStatus('postponed')}>Відкладені</button>
        </div>

        <div className="goals-grid">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onStatusChange={handleStatusChange}
              onToggleStep={handleToggleStep}
            />
          ))}
        </div>
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