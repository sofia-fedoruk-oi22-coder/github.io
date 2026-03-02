import { useEffect, useMemo, useState } from 'react';
import GoalCard from '../components/GoalCard';
import GoalFilter from '../components/GoalFilter';
import ProgressPanel from '../components/ProgressPanel';
import CommunityComments from '../components/CommunityComments';

const initialGoals = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
    alt: 'Навчання програмуванню',
    title: '📘 Вивчити Java',
    deadline: { mode: 'date', value: '2026-06-30' },
    steps: [
      { text: 'Основи', done: false },
      { text: 'ООП', done: false },
      { text: 'JavaFX', done: false }
    ],
    motivation: 'Ця ціль відкриває шлях до першої роботи в ІТ.',
    status: 'active'
  },
  {
    id: 2,
    image: 'https://wintergardens.dance/wp-content/uploads/2024/01/IMG_7268-scaled-e1704531371990.jpg',
    alt: 'Танцювальні тренування',
    title: '💃 Повернутися до танців',
    deadline: { mode: 'date', value: '2026-05-01' },
    steps: [
      { text: 'Запис у студію', done: false },
      { text: 'Регулярні тренування', done: false },
      { text: 'Виступ', done: false }
    ],
    motivation: 'Танці допомагають тримати енергію, форму й внутрішній баланс.',
    status: 'active'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600',
    alt: 'Міжнародна карʼєра',
    title: '🌍 Робота за кордоном',
    deadline: { mode: 'year', value: 2027 },
    steps: [
      { text: 'Англійська', done: false },
      { text: 'Портфоліо', done: false },
      { text: 'Співбесіди', done: false }
    ],
    motivation: 'Це крок до фінансової стабільності та міжнародного досвіду.',
    status: 'deferred'
  }
];

const initialComments = [
  { id: 1, author: 'Оксана', text: 'Маленькі кроки щодня дають великі результати.' },
  { id: 2, author: 'Андрій', text: 'Цілі допомогли мені змінити підхід до життя.' }
];

function getNextReminderTime() {
  const now = new Date();
  const nextReminder = new Date(now);
  nextReminder.setHours(20, 0, 0, 0);

  if (nextReminder <= now) {
    nextReminder.setDate(nextReminder.getDate() + 1);
  }

  return nextReminder;
}

function formatTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
    seconds
  ).padStart(2, '0')}`;
}

export default function HomePage() {
  const [goals, setGoals] = useState(initialGoals);
  const [statusFilter, setStatusFilter] = useState('all');
  const [comments, setComments] = useState(initialComments);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [newGoalDeadlineYear, setNewGoalDeadlineYear] = useState('');
  const [newGoalImage, setNewGoalImage] = useState('');
  const [newGoalSteps, setNewGoalSteps] = useState('');
  const [newGoalMotivation, setNewGoalMotivation] = useState('');
  const [userName, setUserName] = useState('');
  const [userComment, setUserComment] = useState('');
  const [formStatus, setFormStatus] = useState('Заповніть поля та натисніть кнопку.');
  const [nextReminderTime, setNextReminderTime] = useState(getNextReminderTime());
  const [timerText, setTimerText] = useState('Наступне нагадування через: --:--:--');
  const [motivationText, setMotivationText] = useState(
    'Пам\'ятай: маленький крок сьогодні = великий результат завтра 💙'
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerText(`Наступне нагадування через: ${formatTime(nextReminderTime - new Date())}`);

      if (nextReminderTime - new Date() <= 0) {
        const plannedGoals = goals.filter((goal) => goal.status !== 'completed').length;
        setNextReminderTime(getNextReminderTime());
        setMotivationText(
          `Нагадування: у вас ${plannedGoals} запланованих завдань. Зробіть хоча б один крок сьогодні 🚀`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextReminderTime, goals]);

  const filteredGoals = useMemo(() => {
    if (statusFilter === 'all') {
      return goals;
    }

    return goals.filter((goal) => goal.status === statusFilter);
  }, [goals, statusFilter]);

  const completedCount = goals.filter((goal) => goal.status === 'completed').length;
  const plannedCount = goals.filter((goal) => goal.status !== 'completed').length;

  const handleToggleStep = (goalId, stepIndex) => {
    setGoals((previousGoals) =>
      previousGoals.map((goal) => {
        if (goal.id !== goalId || goal.status === 'deferred') {
          return goal;
        }

        const updatedSteps = goal.steps.map((step, index) =>
          index === stepIndex ? { ...step, done: !step.done } : step
        );

        const isCompleted = updatedSteps.length > 0 && updatedSteps.every((step) => step.done);

        return {
          ...goal,
          steps: updatedSteps,
          status: isCompleted ? 'completed' : 'active'
        };
      })
    );
  };

  const handleSetStatus = (goalId, status) => {
    setGoals((previousGoals) =>
      previousGoals.map((goal) => {
        if (goal.id !== goalId) {
          return goal;
        }

        if (status === 'completed') {
          return {
            ...goal,
            status,
            steps: goal.steps.map((step) => ({ ...step, done: true }))
          };
        }

        if (status === 'active') {
          return {
            ...goal,
            status,
            steps: goal.steps.map((step) => ({ ...step, done: false }))
          };
        }

        return {
          ...goal,
          status
        };
      })
    );
  };

  const handleAddGoal = (event) => {
    event.preventDefault();

    if (!newGoalTitle.trim() || !newGoalSteps.trim() || (!newGoalDeadline && !newGoalDeadlineYear)) {
      return;
    }

    const parsedSteps = newGoalSteps
      .split(/[\n,]+/)
      .map((step) => step.trim())
      .filter(Boolean)
      .map((text) => ({ text, done: false }));

    const deadline = newGoalDeadline
      ? { mode: 'date', value: newGoalDeadline }
      : { mode: 'year', value: Number(newGoalDeadlineYear) };

    setGoals((previousGoals) => [
      ...previousGoals,
      {
        id: Date.now(),
        image:
          newGoalImage ||
          'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600',
        alt: newGoalTitle,
        title: newGoalTitle,
        deadline,
        steps: parsedSteps.length > 0 ? parsedSteps : [{ text: 'Новий крок', done: false }],
        motivation: newGoalMotivation || 'Рухайся вперед щодня, навіть маленькими кроками.',
        status: 'active'
      }
    ]);

    setNewGoalTitle('');
    setNewGoalDeadline('');
    setNewGoalDeadlineYear('');
    setNewGoalImage('');
    setNewGoalSteps('');
    setNewGoalMotivation('');
  };

  const handleAddComment = (event) => {
    event.preventDefault();

    if (!userName.trim() || !userComment.trim()) {
      setFormStatus('Будь ласка, заповніть ім’я та коментар.');
      return;
    }

    setComments((previousComments) => [
      ...previousComments,
      {
        id: Date.now(),
        author: userName,
        text: userComment
      }
    ]);

    setFormStatus('Коментар додано у секцію "Спільнота"!');
    setUserName('');
    setUserComment('');
  };

  return (
    <main>
      <section id="goals">
        <h2>Мої цілі</h2>
        <p>Створюй цілі, встановлюй дедлайни та відстежуй свій шлях до успіху!</p>

        <GoalFilter value={statusFilter} onChange={setStatusFilter} />

        <div className="goals-grid">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggleStep={handleToggleStep}
              onSetStatus={handleSetStatus}
            />
          ))}
        </div>
      </section>

      <section id="add-goal">
        <h2>Додати ціль</h2>
        <p>Опишіть нову ціль і створіть чіткий план дій для її досягнення.</p>

        <form className="goal-form" onSubmit={handleAddGoal}>
          <div className="form-group">
            <label htmlFor="goal-title">Назва цілі:</label>
            <input
              id="goal-title"
              type="text"
              value={newGoalTitle}
              onChange={(event) => setNewGoalTitle(event.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="goal-deadline">Дедлайн:</label>
            <input
              id="goal-deadline"
              type="date"
              value={newGoalDeadline}
              onChange={(event) => setNewGoalDeadline(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="goal-deadline-year">Або тільки рік дедлайну:</label>
            <input
              id="goal-deadline-year"
              type="number"
              min="1900"
              max="2100"
              value={newGoalDeadlineYear}
              onChange={(event) => setNewGoalDeadlineYear(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="goal-image-url">Посилання на фотографію:</label>
            <input
              id="goal-image-url"
              type="url"
              value={newGoalImage}
              onChange={(event) => setNewGoalImage(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="goal-steps">Кроки для виконання:</label>
            <textarea
              id="goal-steps"
              rows="4"
              value={newGoalSteps}
              onChange={(event) => setNewGoalSteps(event.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="goal-motivation">Мотивація:</label>
            <textarea
              id="goal-motivation"
              rows="3"
              value={newGoalMotivation}
              onChange={(event) => setNewGoalMotivation(event.target.value)}
            />
          </div>
          <button className="btn-submit" type="submit">
            Зберегти ціль
          </button>
        </form>
      </section>

      <ProgressPanel
        completedCount={completedCount}
        totalCount={goals.length}
        plannedCount={plannedCount}
        timerText={timerText}
        motivationText={motivationText}
      />

      <CommunityComments comments={comments} />

      <section id="feedback">
        <h2>Форма коментаря</h2>
        <p>Залиште свої дані та коментар.</p>

        <form className="goal-form" onSubmit={handleAddComment}>
          <div className="form-group">
            <label htmlFor="user-name">Ім'я:</label>
            <input
              id="user-name"
              type="text"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="user-comment">Коментар:</label>
            <textarea
              id="user-comment"
              rows="4"
              value={userComment}
              onChange={(event) => setUserComment(event.target.value)}
            />
          </div>
          <button type="submit" className="btn-submit">
            Надіслати коментар
          </button>
          <p className="form-status">{formStatus}</p>
        </form>
      </section>
    </main>
  );
}
