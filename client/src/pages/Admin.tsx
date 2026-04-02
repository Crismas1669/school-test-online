import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Админ',
  teacher: 'Учитель',
  student: 'Ученик',
};

export default function Admin() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setUsers);
  }, []);

  const changeRole = async (id: number, role: string) => {
    await fetch(`/api/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    });
    setUsers(users.map(u => u.id === id ? { ...u, role } : u));
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Удалить пользователя?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className="admin">
      <h1>Управление пользователями</h1>
      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Дата регистрации</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                    className={`role-badge role-${u.role}`}>
                    <option value="student">Ученик</option>
                    <option value="teacher">Учитель</option>
                    <option value="admin">Админ</option>
                  </select>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString('ru-RU')}</td>
                <td>
                  {u.id !== user?.id && (
                    <button className="btn-danger-sm" onClick={() => deleteUser(u.id)}>Удалить</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
