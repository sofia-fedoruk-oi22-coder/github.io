import React from 'react';

function About() {
  return (
    <main>
      <section id="about">
        <h2>Про платформу</h2>
        <p>Ця платформа допомагає створювати, планувати й відстежувати персональні цілі.</p>
        <article className="progress-item">
          🎯 Керуйте цілями, дедлайнами та кроками виконання в одному місці.
        </article>
        <article className="progress-item">
          📊 Аналізуйте прогрес і фокусуйтеся на найважливіших результатах.
        </article>
      </section>
    </main>
  );
}

export default About;