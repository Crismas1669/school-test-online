import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">
            <span className="logo-icon">📝</span>
            <span>ШкольныйТестОнлайн</span>
          </Link>
          <nav className="nav">
            <Link to="/" className={isActive('/')}>Тесты</Link>
            {user && (user.role === 'teacher' || user.role === 'admin') && (
              <Link to="/create" className={isActive('/create')}>Создать тест</Link>
            )}
            {user && user.role === 'admin' && (
              <Link to="/admin" className={isActive('/admin')}>Пользователи</Link>
            )}
          </nav>
          <div className="header-user">
            {user ? (
              <>
                <span className={`role-chip role-${user.role}`}>
                  {user.role === 'admin' ? 'Админ' : user.role === 'teacher' ? 'Учитель' : 'Ученик'}
                </span>
                <span className="user-name">{user.name}</span>
                <button className="btn-logout" onClick={handleLogout}>Выйти</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-nav-auth">Войти</Link>
                <Link to="/register" className="btn-nav-auth primary">Регистрация</Link>
              </>
            )}
          </div>
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
