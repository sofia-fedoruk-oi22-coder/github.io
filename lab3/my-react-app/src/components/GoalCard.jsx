function formatDeadline(deadline) {
  if (deadline.mode === 'year') {
    return String(deadline.value);
  }

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
    'грудня'
  ];

  const parts = String(deadline.value).split('-');
  if (parts.length !== 3) {
    return String(deadline.value);
  }

  const year = parts[0];
  const monthIndex = Number(parts[1]) - 1;
  const day = String(parts[2]).padStart(2, '0');
  const monthName = monthNames[monthIndex] || parts[1];

  return `${day} ${monthName} ${year}`;
}

export default function GoalCard({ goal, onToggleStep, onSetStatus }) {
  return (
    <article className={`goal-card ${goal.status === 'completed' ? 'goal-completed' : ''}`}>
      <img src={goal.image} alt={goal.alt} />
      <h3>{goal.title}</h3>
      <p>
        <strong>Дедлайн:</strong> {formatDeadline(goal.deadline)}
      </p>

      <ul className="goal-checklist">
        {goal.steps.map((step, index) => (
          <li key={`${goal.id}-${index}`}>
            <label>
              <input
                type="checkbox"
                checked={step.done}
                onChange={() => onToggleStep(goal.id, index)}
                disabled={goal.status === 'deferred'}
              />
              <span>{step.text}</span>
            </label>
          </li>
        ))}
      </ul>

      <p className="goal-motivation">
        <strong>Мотивація:</strong> {goal.motivation}
      </p>

      <div className="goal-actions">
        <button
          type="button"
          className="goal-complete-btn"
          onClick={() => onSetStatus(goal.id, 'active')}
        >
          Активна
        </button>
        <button
          type="button"
          className="goal-complete-btn done"
          onClick={() => onSetStatus(goal.id, 'completed')}
        >
          Завершена
        </button>
        <button
          type="button"
          className="goal-complete-btn deferred"
          onClick={() => onSetStatus(goal.id, 'deferred')}
        >
          Відкладена
        </button>
      </div>
    </article>
  );
}
