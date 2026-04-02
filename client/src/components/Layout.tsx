import { Outlet, Link, useLocation } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">
            <span className="logo-icon">📝</span>
            <span>ШкольныйТестОнлайн</span>
          </Link>
          <nav className="nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Тесты</Link>
            <Link to="/create" className={location.pathname === '/create' ? 'active' : ''}>Создать тест</Link>
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>© 2026 ШкольныйТестОнлайн — платформа для создания тестов</p>
      </footer>
    </div>
  );
}
