export default function ProgressPanel({ completedCount, totalCount, plannedCount, timerText, motivationText }) {
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <section id="progress">
      <h2>Прогрес</h2>
      <p>Ваші досягнення та результати:</p>

      <article className="progress-item">🏆 Виконано {completedCount} з {totalCount} цілей ({percent}%).</article>
      <article className="progress-item">📌 Запланованих цілей: {plannedCount}.</article>

      <div className="daily-timer-panel">
        <h3>Щоденний мотивуючий таймер</h3>
        <p>{timerText}</p>
        <p>{motivationText}</p>
      </div>
    </section>
  );
}
