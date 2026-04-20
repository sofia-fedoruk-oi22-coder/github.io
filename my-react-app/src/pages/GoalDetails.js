import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useGoals from '../hooks/useGoals';

const monthNames = [
  'січня',
  'лютого',
  'березня',
  'квітня',
  'травня',
  'червня',
  'липня',
  'серпня',
  'вересня',
  'жовтня',
  'листопада',
  'грудня',
];

const statusLabel = {
  active: 'Активна',
  completed: 'Завершена',
  postponed: 'Відкладена',
};

function formatDeadline(deadline) {
  if (!deadline || deadline === 'Без дедлайну') {
    return 'Без дедлайну';
  }

  const matchedDate = deadline.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchedDate) {
    const [, year, month, day] = matchedDate;
    const monthIndex = Number(month) - 1;
    if (monthIndex >= 0 && monthIndex < monthNames.length) {
      return `${Number(day)} ${monthNames[monthIndex]} ${year}`;
    }
  }

  return deadline;
}

function GoalDetails({ user }) {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const {
    goals,
    deleteGoal,
    updateGoal,
  } = useGoals(user);

  const goal = useMemo(
    () => goals.find((item) => item.id === goalId),
    [goals, goalId]
  );

  const [draft, setDraft] = useState(() => {
    if (!goal) {
      return null;
    }

    return {
      ...goal,
      stepsText: goal.steps.map((step) => step.text).join('\n'),
    };
  });

  if (!goal) {
    return (
      <main>
        <section>
          <h2>Ціль не знайдено</h2>
          <p>Можливо, її вже видалено або шлях некоректний.</p>
          <Link className="btn-submit" to="/">Повернутися до списку</Link>
        </section>
      </main>
    );
  }

  const currentGoal = isEditing && draft ? draft : goal;

  const handleDelete = async () => {
    await deleteGoal(goal.id);
    navigate('/');
  };

  const handleStartEdit = () => {
    setDraft({
      ...goal,
      stepsText: goal.steps.map((step) => step.text).join('\n'),
    });
    setIsEditing(true);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const normalizedSteps = (draft.stepsText || '')
      .split('\n')
      .map((step) => step.trim())
      .filter(Boolean)
      .map((step) => ({ text: step, done: false }));

    const updates = {
      title: draft.title.trim() || goal.title,
      motivation: draft.motivation.trim() || goal.motivation,
      image: draft.image.trim() || goal.image,
      deadline: draft.deadline,
      status: draft.status,
      steps: normalizedSteps.length ? normalizedSteps : goal.steps,
    };

    await updateGoal(goal.id, updates);
    setIsEditing(false);
  };

  const handleToggleStep = async (stepIndex) => {
    const updatedSteps = goal.steps.map((step, index) => {
      if (index !== stepIndex) {
        return step;
      }

      return { ...step, done: !step.done };
    });

    const allDone = updatedSteps.every((step) => step.done);

    await updateGoal(goal.id, {
      steps: updatedSteps,
      status: allDone ? 'completed' : goal.status === 'completed' ? 'active' : goal.status,
    });
  };

  const detailSteps = [];
  for (let index = 0; index < goal.steps.length; index += 1) {
    const step = goal.steps[index];
    detailSteps.push(
      <li key={`${goal.id}-detail-step-${index}`}>
        <label>
          <input
            type="checkbox"
            checked={step.done}
            onChange={() => handleToggleStep(index)}
            disabled={isEditing}
          />
          {step.text}
        </label>
      </li>
    );
  }

  return (
    <main>
      <section className="goal-details">
        <h2>{currentGoal.title}</h2>

        <div className="goal-details-image-wrap">
          <img src={currentGoal.image} alt={currentGoal.title} />
        </div>

        {isEditing ? (
          <div className="goal-form">
            <div className="form-group">
              <label htmlFor="edit-title">Назва цілі:</label>
              <input id="edit-title" name="title" value={draft.title} onChange={handleEditChange} />
            </div>

            <div className="form-group">
              <label htmlFor="edit-deadline">Дедлайн:</label>
              <input id="edit-deadline" name="deadline" type="date" value={draft.deadline} onChange={handleEditChange} />
            </div>

            <div className="form-group">
              <label htmlFor="edit-motivation">Мотивація:</label>
              <textarea id="edit-motivation" name="motivation" rows="4" value={draft.motivation} onChange={handleEditChange} />
            </div>

            <div className="form-group">
              <label htmlFor="edit-image">Посилання на картинку:</label>
              <input id="edit-image" name="image" type="url" value={draft.image} onChange={handleEditChange} />
            </div>

            <div className="form-group">
              <label htmlFor="edit-status">Статус:</label>
              <select id="edit-status" name="status" value={draft.status} onChange={handleEditChange}>
                <option value="active">Активна</option>
                <option value="completed">Завершена</option>
                <option value="postponed">Відкладена</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-steps">Кроки (по одному на рядок):</label>
              <textarea id="edit-steps" name="stepsText" rows="6" value={draft.stepsText} onChange={handleEditChange} />
            </div>

            <div className="goal-details-actions">
              <button className="btn-submit" type="button" onClick={handleSave}>Зберегти зміни</button>
              <button className="btn-submit" type="button" onClick={() => setIsEditing(false)}>Скасувати</button>
            </div>
          </div>
        ) : (
          <>
            <p><strong>Дедлайн:</strong> {formatDeadline(goal.deadline)}</p>
            <p><strong>Мотивація:</strong> {goal.motivation}</p>
            <p><strong>Статус:</strong> <span className={`status-chip status-${goal.status}`}>{statusLabel[goal.status]}</span></p>

            <h3>Кроки досягнення</h3>
            <ul className="goal-checklist">{detailSteps}</ul>

            <div className="goal-details-actions">
              <button className="btn-submit" type="button" onClick={handleStartEdit}>Редагувати ціль</button>
              <button className="btn-submit" type="button" onClick={handleDelete}>Видалити ціль</button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default GoalDetails;
