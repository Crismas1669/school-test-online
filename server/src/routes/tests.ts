import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const db = await getDb();
  const tests = await db.all('SELECT * FROM tests ORDER BY created_at DESC');
  res.json(tests);
});

router.get('/:id', async (req: Request, res: Response) => {
  const db = await getDb();
  const test = await db.get('SELECT * FROM tests WHERE id = ?', req.params.id);
  if (!test) return res.status(404).json({ error: 'Test not found' });

  const questions = await db.all(
    'SELECT * FROM questions WHERE test_id = ? ORDER BY order_index',
    req.params.id
  );

  const questionsWithOptions = await Promise.all(
    questions.map(async (q: any) => ({
      ...q,
      options: await db.all('SELECT * FROM options WHERE question_id = ?', q.id),
    }))
  );

  res.json({ ...test, questions: questionsWithOptions });
});

router.post('/', async (req: Request, res: Response) => {
  const { title, description, questions } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const db = await getDb();
  await db.run('BEGIN');
  try {
    const testResult = await db.run(
      'INSERT INTO tests (title, description) VALUES (?, ?)',
      title, description || ''
    );
    const testId = testResult.lastID;

    for (let idx = 0; idx < (questions || []).length; idx++) {
      const q = questions[idx];
      const qResult = await db.run(
        'INSERT INTO questions (test_id, text, type, order_index, image_url) VALUES (?, ?, ?, ?, ?)',
        testId, q.text, q.type || 'single', idx, q.image_url || null
      );
      for (const opt of (q.options || [])) {
        await db.run(
          'INSERT INTO options (question_id, text, is_correct) VALUES (?, ?, ?)',
          qResult.lastID, opt.text, opt.is_correct ? 1 : 0
        );
      }
    }

    await db.run('COMMIT');
    res.status(201).json({ id: testId });
  } catch {
    await db.run('ROLLBACK');
    res.status(500).json({ error: 'Failed to save test' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const db = await getDb();
  await db.run('DELETE FROM tests WHERE id = ?', req.params.id);
  res.json({ success: true });
});

export default router;
