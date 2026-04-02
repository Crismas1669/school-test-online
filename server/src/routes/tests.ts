import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const db = await getDb();
  const tests = await db.all(`
    SELECT t.*, u.name as author_name FROM tests t
    LEFT JOIN users u ON t.author_id = u.id
    ORDER BY t.created_at DESC
  `);
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

router.post('/', authMiddleware, requireRole('teacher', 'admin'), async (req: AuthRequest, res: Response) => {
  const { title, description, questions } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const db = await getDb();
  await db.run('BEGIN');
  try {
    const testResult = await db.run(
      'INSERT INTO tests (title, description, author_id) VALUES (?, ?, ?)',
      title, description || '', req.user!.id
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

router.delete('/:id', authMiddleware, requireRole('teacher', 'admin'), async (req: AuthRequest, res: Response) => {
  const db = await getDb();
  const test = await db.get('SELECT * FROM tests WHERE id = ?', req.params.id);
  if (!test) return res.status(404).json({ error: 'Not found' });
  if (req.user!.role !== 'admin' && test.author_id !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await db.run('DELETE FROM tests WHERE id = ?', req.params.id);
  res.json({ success: true });
});

// Save result
router.post('/:id/results', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { score, total } = req.body;
  const db = await getDb();
  await db.run(
    'INSERT INTO results (test_id, user_id, score, total) VALUES (?, ?, ?, ?)',
    req.params.id, req.user!.id, score, total
  );
  res.status(201).json({ success: true });
});

// Get results for a test (teacher/admin)
router.get('/:id/results', authMiddleware, requireRole('teacher', 'admin'), async (req: Request, res: Response) => {
  const db = await getDb();
  const results = await db.all(`
    SELECT r.*, u.name as student_name FROM results r
    JOIN users u ON r.user_id = u.id
    WHERE r.test_id = ?
    ORDER BY r.created_at DESC
  `, req.params.id);
  res.json(results);
});

export default router;
