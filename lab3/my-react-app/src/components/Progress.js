import React from 'react';

function Progress({ goals }) {
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
    </>
  );
}

export default Progress;