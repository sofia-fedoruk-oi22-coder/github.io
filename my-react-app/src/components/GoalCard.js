import React from 'react';
import { Link } from 'react-router-dom';

const statusLabel = {
  active: 'Активна',
  completed: 'Завершена',
  postponed: 'Відкладена',
};

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

function GoalCard({ goal, onStatusChange }) {
  return (
    <article className={`goal-card ${goal.status === 'completed' ? 'goal-card-completed' : ''}`}>
      <Link className="goal-card-link" to={`/goal/${goal.id}`}>
        <img src={goal.image} alt={goal.title} />
        <h3>{goal.title}</h3>
        <p><strong>Дедлайн:</strong> {formatDeadline(goal.deadline)}</p>
        <p className="goal-motivation"><strong>Мотивація:</strong> {goal.motivation}</p>
        <p><strong>Статус:</strong> <span className={`status-chip status-${goal.status}`}>{statusLabel[goal.status]}</span></p>
      </Link>

      <div className="status-controls">
        <button className="btn-submit" type="button" onClick={() => onStatusChange(goal.id, 'active')}>Активна</button>
        <button className="btn-submit" type="button" onClick={() => onStatusChange(goal.id, 'completed')}>Завершена</button>
        <button className="btn-submit" type="button" onClick={() => onStatusChange(goal.id, 'postponed')}>Відкладена</button>
      </div>
    </article>
  );
}

export default GoalCard;