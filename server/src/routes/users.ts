import { Router, Response } from 'express';
import { getDb } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, requireRole('admin'), async (_req: AuthRequest, res: Response) => {
  const db = await getDb();
  const users = await db.all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
  res.json(users);
});

router.patch('/:id/role', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const db = await getDb();
  await db.run('UPDATE users SET role = ? WHERE id = ?', role, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const db = await getDb();
  await db.run('DELETE FROM users WHERE id = ?', req.params.id);
  res.json({ success: true });
});

export default router;
