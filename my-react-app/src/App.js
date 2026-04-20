import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import GoalDetails from './pages/GoalDetails';
import useAuth from './hooks/useAuth';
import useGoals from './hooks/useGoals';


function ProtectedRoute({ user, loadingAuth, children }) {
  if (loadingAuth) {
    return (
      <main>
        <section>
          <h2>Перевірка авторизації...</h2>
        </section>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function AuthPage({
  mode,
  setMode,
  email,
  password,
  setEmail,
  setPassword,
  authError,
  authInfo,
  onSubmit,
}) {
  return (
    <main>
      <section className="goal-form auth-panel">
        <h2>Авторизація</h2>
        <div className="auth-mode-switch">
          <button
            className="btn-submit"
            type="button"
            onClick={() => setMode('login')}
          >
            Вхід
          </button>
          <button
            className="btn-submit"
            type="button"
            onClick={() => setMode('register')}
          >
            Реєстрація
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="auth-email">Email:</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="auth-password">Пароль:</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Мінімум 6 символів"
              required
              minLength={6}
            />
          </div>
          <button className="btn-submit" type="submit">
            {mode === 'register' ? 'Зареєструватися' : 'Увійти'}
          </button>
        </form>
        {authInfo ? <p className="auth-message auth-success">{authInfo}</p> : null}
        {authError ? <p className="auth-message auth-error">{authError}</p> : null}
      </section>
    </main>
  );
}

function App() {
  const {
    user,
    loadingAuth,
    authMode,
    setAuthMode,
    email,
    setEmail,
    password,
    setPassword,
    authError,
    authInfo,
    handleAuthSubmit,
    handleLogout,
    isAccountMenuOpen,
    setIsAccountMenuOpen,
    goToAuth,
    profileDisplayName,
    setProfileDisplayName,
    profileAge,
    setProfileAge,
    profileInfo,
    profileError,
    saveProfile,
    accountBadge,
  } = useAuth();

  const {
    goalsError,
  } = useGoals(user);

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
        <div className="header-top-row">
          <h1>🎯 Платформа персональних цілей</h1>
          <div className="account-menu-wrap">
            <button
              className="account-icon-btn"
              type="button"
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              aria-label="Меню акаунта"
            >
              {accountBadge}
            </button>
            {isAccountMenuOpen ? (
              <div className="account-dropdown">
                {!user ? (
                  <>
                    <p>Гість</p>
                    <button className="btn-submit" type="button" onClick={() => goToAuth('login')}>Увійти</button>
                    <button className="btn-submit" type="button" onClick={() => goToAuth('register')}>Зареєструватися</button>
                  </>
                ) : (
                  <>
                    <p>Акаунт: {user.email}</p>
                    <form onSubmit={saveProfile}>
                      <div className="form-group">
                        <label htmlFor="profile-displayName">Ім'я:</label>
                        <input
                          id="profile-displayName"
                          type="text"
                          value={profileDisplayName}
                          onChange={(event) => setProfileDisplayName(event.target.value)}
                          placeholder="Ваше ім'я"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="profile-age">Вік:</label>
                        <input
                          id="profile-age"
                          type="number"
                          min="0"
                          value={profileAge}
                          onChange={(event) => setProfileAge(event.target.value)}
                          placeholder="Наприклад: 24"
                        />
                      </div>
                      <button className="btn-submit" type="submit">Зберегти профіль</button>
                    </form>
                    {profileInfo ? <p className="auth-message auth-success">{profileInfo}</p> : null}
                    {profileError ? <p className="auth-message auth-error">{profileError}</p> : null}
                    <button className="btn-submit" type="button" onClick={handleLogout}>Вийти</button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
        <nav>
          <ul>
            <li><Link to="/">Головна</Link></li>
            <li><Link to="/about">Про платформу</Link></li>
          </ul>
        </nav>
        {goalsError ? (
          <div className="auth-status">
            <p>{goalsError}</p>
          </div>
        ) : null}
      </header>
      <Routes>
        <Route
          path="/"
          element={(
            <ProtectedRoute user={user} loadingAuth={loadingAuth}>
              <Home user={user} />
            </ProtectedRoute>
          )}
        />
        <Route path="/about" element={<About />} />
        <Route
          path="/goal/:goalId"
          element={(
            <ProtectedRoute user={user} loadingAuth={loadingAuth}>
              <GoalDetails user={user} />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/auth"
          element={(
            <AuthPage
              mode={authMode}
              setMode={setAuthMode}
              email={email}
              password={password}
              setEmail={setEmail}
              setPassword={setPassword}
              authError={authError}
              authInfo={authInfo}
              onSubmit={handleAuthSubmit}
            />
          )}
        />
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