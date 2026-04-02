import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

interface Test {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

export default function Home() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = () => {
    fetch('/api/tests')
      .then(r => r.json())
      .then(data => { setTests(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTests(); }, []);

  const deleteTest = async (id: number) => {
    if (!confirm('Удалить тест?')) return;
    await fetch(`/api/tests/${id}`, { method: 'DELETE' });
    fetchTests();
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="home">
      <div className="home-header">
        <h1>Мои тесты</h1>
        <Link to="/create" className="btn-primary">+ Создать тест</Link>
      </div>

      {tests.length === 0 ? (
        <div className="empty">
          <p>Тестов пока нет.</p>
          <Link to="/create" className="btn-primary">Создать первый тест</Link>
        </div>
      ) : (
        <div className="tests-grid">
          {tests.map(test => (
            <div key={test.id} className="test-card">
              <div className="test-card-body">
                <h2>{test.title}</h2>
                {test.description && <p className="test-desc">{test.description}</p>}
                <span className="test-date">{new Date(test.created_at).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="test-card-actions">
                <Link to={`/test/${test.id}`} className="btn-primary">Пройти</Link>
                <button onClick={() => deleteTest(test.id)} className="btn-danger">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
