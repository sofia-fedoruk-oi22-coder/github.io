import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';

function App() {
  const [goals, setGoals] = useState([
    {
      id: 1,
      icon: '📘',
      title: 'Вивчити Java',
      deadline: '2026-06-30',
      motivation: 'Ця ціль відкриває шлях до першої роботи в ІТ.',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
      steps: [
        { text: 'Основи', done: true },
        { text: 'ООП', done: false },
        { text: 'JavaFX', done: false },
      ],
    },
    {
      id: 2,
      icon: '💃',
      title: 'Повернутися до танців',
      deadline: '2026-05-01',
      motivation: 'Танці допомагають тримати енергію, форму й внутрішній баланс.',
      status: 'postponed',
      image: 'https://wintergardens.dance/wp-content/uploads/2024/01/IMG_7268-scaled-e1704531371990.jpg',
      steps: [
        { text: 'Запис у студію', done: true },
        { text: 'Регулярні тренування', done: false },
        { text: 'Виступ', done: false },
      ],
    },
    {
      id: 3,
      icon: '🌍',
      title: 'Робота за кордоном',
      deadline: '2027-01-01',
      motivation: 'Це крок до фінансової стабільності та міжнародного досвіду.',
      status: 'completed',
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600',
      steps: [
        { text: 'Англійська', done: true },
        { text: 'Портфоліо', done: true },
        { text: 'Співбесіди', done: true },
      ],
    },
  ]);

  useEffect(() => {
    const navLinks = document.querySelectorAll('nav a');
    const cleanupCallbacks = [];

    for (let index = 0; index < navLinks.length; index += 1) {
      const currentLink = navLinks[index];
      const handleMouseEnter = () => {
        currentLink.style.color = '#6c63ff';
      };

      const handleMouseLeave = () => {
        currentLink.style.color = '';
      };

      currentLink.addEventListener('mouseenter', handleMouseEnter);
      currentLink.addEventListener('mouseleave', handleMouseLeave);

      cleanupCallbacks.push(() => {
        currentLink.removeEventListener('mouseenter', handleMouseEnter);
        currentLink.removeEventListener('mouseleave', handleMouseLeave);
      });
    }

    return () => {
      cleanupCallbacks.forEach((callback) => callback());
    };
  }, []);

  return (
    <HashRouter>
      <header>
        <h1>🎯 Платформа персональних цілей</h1>
        <nav>
          <ul>
            <li><Link to="/">Головна</Link></li>
            <li><Link to="/about">Про платформу</Link></li>
          </ul>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home goals={goals} setGoals={setGoals} />} />
        <Route path="/about" element={<About />} />
      </Routes>
      <footer>
        <p>© 2026 Платформа персональних цілей. Всі права захищені.</p>
        <p>📍 Львів, Україна</p>
        <p>Контактна інформація:</p>
        <p>📞 +380 (99) 123-45-67</p>
        <p>✉️ goals@platform.com</p>
      </footer>
    </HashRouter>
  );
}

export default App;