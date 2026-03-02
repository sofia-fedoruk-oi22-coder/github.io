import './App.css';
import { NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <div className="app-shell">
      <header>
        <h1>🎯 Платформа персональних цілей</h1>
        <nav>
          <ul>
            <li>
              <NavLink to="/" end>
                Головна
              </NavLink>
            </li>
            <li>
              <NavLink to="/about">Про компанію</NavLink>
            </li>
          </ul>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>

      <footer>
        <p>© 2026 Платформа персональних цілей. Всі права захищені.</p>
        <p>📍 Львів, Україна</p>
        <p>Контактна інформація: 📞 +380 (99) 123-45-67 | ✉️ goals@platform.com</p>
      </footer>
    </div>
  );
}

export default App;
