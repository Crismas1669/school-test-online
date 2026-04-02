import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './CreateTest.css';

interface Option {
  text: string;
  is_correct: boolean;
}

interface Question {
  text: string;
  type: 'single' | 'multiple';
  options: Option[];
  image_url?: string;
  imageFile?: File;
}

export default function CreateTest() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', type: 'single', options: [{ text: '', is_correct: false }, { text: '', is_correct: false }] }
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addQuestion = () => {
    setQuestions([...questions, { text: '', type: 'single', options: [{ text: '', is_correct: false }, { text: '', is_correct: false }] }]);
  };

  const removeQuestion = (qi: number) => {
    setQuestions(questions.filter((_, i) => i !== qi));
  };

  const updateQuestion = (qi: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    (updated[qi] as any)[field] = value;
    if (field === 'type' && value === 'single') {
      // reset to single correct
      updated[qi].options = updated[qi].options.map(o => ({ ...o, is_correct: false }));
    }
    setQuestions(updated);
  };

  const addOption = (qi: number) => {
    const updated = [...questions];
    updated[qi].options.push({ text: '', is_correct: false });
    setQuestions(updated);
  };

  const removeOption = (qi: number, oi: number) => {
    const updated = [...questions];
    updated[qi].options = updated[qi].options.filter((_, i) => i !== oi);
    setQuestions(updated);
  };

  const updateOption = (qi: number, oi: number, field: keyof Option, value: any) => {
    const updated = [...questions];
    if (field === 'is_correct' && updated[qi].type === 'single') {
      updated[qi].options = updated[qi].options.map((o, i) => ({ ...o, is_correct: i === oi }));
    } else {
      (updated[qi].options[oi] as any)[field] = value;
    }
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) return setError('Введите название теста');
    for (const q of questions) {
      if (!q.text.trim()) return setError('Заполните текст всех вопросов');
      if (q.options.some(o => !o.text.trim())) return setError('Заполните текст всех вариантов ответа');
      if (!q.options.some(o => o.is_correct)) return setError('Отметьте хотя бы один правильный ответ в каждом вопросе');
    }

    setSaving(true);
    try {
      // upload images first
      const questionsWithUrls = await Promise.all(questions.map(async (q) => {
        if (q.imageFile) {
          const fd = new FormData();
          fd.append('image', q.imageFile);
          const r = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
          const data = await r.json();
          return { ...q, image_url: data.url, imageFile: undefined };
        }
        return q;
      }));

      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, questions: questionsWithUrls }),
      });
      const data = await res.json();
      navigate(`/test/${data.id}`);
    } catch {
      setError('Ошибка при сохранении');
      setSaving(false);
    }
  };

  return (
    <div className="create">
      <h1>Создать тест</h1>
      <form onSubmit={handleSubmit} className="create-form">
        <div className="form-group">
          <label>Название теста *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Введите название" />
        </div>
        <div className="form-group">
          <label>Описание</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Краткое описание теста" rows={3} />
        </div>

        <div className="questions-section">
          <h2>Вопросы</h2>
          {questions.map((q, qi) => (
            <div key={qi} className="question-block">
              <div className="question-header">
                <span className="question-num">Вопрос {qi + 1}</span>
                <select value={q.type} onChange={e => updateQuestion(qi, 'type', e.target.value)}>
                  <option value="single">Один ответ</option>
                  <option value="multiple">Несколько ответов</option>
                </select>
                {questions.length > 1 && (
                  <button type="button" className="btn-remove" onClick={() => removeQuestion(qi)}>✕</button>
                )}
              </div>
              <div className="form-group">
                <input
                  value={q.text}
                  onChange={e => updateQuestion(qi, 'text', e.target.value)}
                  placeholder="Текст вопроса"
                />
              </div>
              <div className="image-upload-row">
                <label className="btn-upload-img">
                  📷 {q.image_url ? 'Заменить фото' : 'Добавить фото'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const updated = [...questions];
                      updated[qi].imageFile = file;
                      updated[qi].image_url = URL.createObjectURL(file);
                      setQuestions(updated);
                    }}
                  />
                </label>
                {q.image_url && (
                  <div className="img-preview-wrap">
                    <img src={q.image_url} alt="preview" className="img-preview" />
                    <button type="button" className="btn-remove-sm" onClick={() => {
                      const updated = [...questions];
                      updated[qi].image_url = undefined;
                      updated[qi].imageFile = undefined;
                      setQuestions(updated);
                    }}>✕</button>
                  </div>
                )}
              </div>
              <div className="options-list">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="option-row">
                    <input
                      type={q.type === 'single' ? 'radio' : 'checkbox'}
                      checked={opt.is_correct}
                      onChange={e => updateOption(qi, oi, 'is_correct', e.target.checked)}
                      title="Правильный ответ"
                    />
                    <input
                      className="option-text"
                      value={opt.text}
                      onChange={e => updateOption(qi, oi, 'text', e.target.value)}
                      placeholder={`Вариант ${oi + 1}`}
                    />
                    {q.options.length > 2 && (
                      <button type="button" className="btn-remove-sm" onClick={() => removeOption(qi, oi)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-add-option" onClick={() => addOption(qi)}>+ Добавить вариант</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn-add-question" onClick={addQuestion}>+ Добавить вопрос</button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/')}>Отмена</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить тест'}
          </button>
        </div>
      </form>
    </div>
  );
}
