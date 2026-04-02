import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './TakeTest.css';

interface Option {
  id: number;
  text: string;
  is_correct: number;
}

interface Question {
  id: number;
  text: string;
  type: string;
  image_url?: string;
  options: Option[];
}

interface Test {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

export default function TakeTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch(`/api/tests/${id}`)
      .then(r => r.json())
      .then(setTest);
  }, [id]);

  const toggleAnswer = (qId: number, optId: number, type: string) => {
    if (submitted) return;
    setAnswers(prev => {
      const current = prev[qId] || [];
      if (type === 'single') return { ...prev, [qId]: [optId] };
      return current.includes(optId)
        ? { ...prev, [qId]: current.filter(id => id !== optId) }
        : { ...prev, [qId]: [...current, optId] };
    });
  };

  const handleSubmit = async () => {
    if (!test) return;
    let correct = 0;
    test.questions.forEach(q => {
      const selected = answers[q.id] || [];
      const correctIds = q.options.filter(o => o.is_correct).map(o => o.id);
      const isCorrect =
        selected.length === correctIds.length &&
        correctIds.every(id => selected.includes(id));
      if (isCorrect) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    if (user && token) {
      await fetch(`/api/tests/${id}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score: correct, total: test.questions.length }),
      });
    }
  };

  const getOptionClass = (q: Question, opt: Option) => {
    if (!submitted) return answers[q.id]?.includes(opt.id) ? 'selected' : '';
    const selected = answers[q.id]?.includes(opt.id);
    if (opt.is_correct) return 'correct';
    if (selected && !opt.is_correct) return 'wrong';
    return '';
  };

  if (!test) return <div className="loading">Загрузка теста...</div>;

  return (
    <div className="take-test">
      <div className="test-title-block">
        <h1>{test.title}</h1>
        {test.description && <p className="test-desc">{test.description}</p>}
      </div>

      {submitted && (
        <div className="result-banner">
          <span>Результат: {score} из {test.questions.length}</span>
          <span className="score-pct">{Math.round(score / test.questions.length * 100)}%</span>
        </div>
      )}

      <div className="questions">
        {test.questions.map((q, qi) => (
          <div key={q.id} className={`question-card ${submitted ? 'done' : ''}`}>
            <div className="q-header">
              <span className="q-num">{qi + 1}</span>
              <p className="q-text">{q.text}</p>
            </div>
            {q.image_url && (
              <img src={q.image_url} alt="вопрос" className="q-image" />
            )}
            <div className="q-type-hint">{q.type === 'single' ? 'Один ответ' : 'Несколько ответов'}</div>
            <div className="options">
              {q.options.map(opt => (
                <label key={opt.id} className={`option ${getOptionClass(q, opt)}`}>
                  <input
                    type={q.type === 'single' ? 'radio' : 'checkbox'}
                    checked={answers[q.id]?.includes(opt.id) || false}
                    onChange={() => toggleAnswer(q.id, opt.id, q.type)}
                    disabled={submitted}
                  />
                  <span>{opt.text}</span>
                  {submitted && opt.is_correct && <span className="correct-mark">✓</span>}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!submitted ? (
        <div className="submit-area">
          <button className="btn-submit" onClick={handleSubmit}>Завершить тест</button>
        </div>
      ) : (
        <div className="submit-area">
          <button className="btn-secondary" onClick={() => navigate('/')}>На главную</button>
          <button className="btn-primary" onClick={() => { setAnswers({}); setSubmitted(false); }}>Пройти снова</button>
        </div>
      )}
    </div>
  );
}
