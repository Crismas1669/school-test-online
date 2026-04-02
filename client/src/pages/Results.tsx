import { useNavigate } from 'react-router-dom';

export default function Results() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h1>Результаты</h1>
      <p style={{ color: '#718096', marginTop: 12 }}>Результаты отображаются сразу после прохождения теста.</p>
      <button onClick={() => navigate('/')} style={{ marginTop: 24, padding: '10px 24px', background: '#2b6cb0', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
        На главную
      </button>
    </div>
  );
}
