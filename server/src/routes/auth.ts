import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db';
import { JWT_SECRET, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, role, adminCode } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });

  let userRole = 'student';
  if (adminCode === 'MainBash14') {
    userRole = 'admin';
  } else if (role === 'teacher') {
    userRole = 'teacher';
  }

  const db = await getDb();
  const existing = await db.get('SELECT id FROM users WHERE email = ?', email);
  if (existing) return res.status(400).json({ error: 'Email уже используется' });

  const hashed = await bcrypt.hash(password, 10);
  const result = await db.run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    name, email, hashed, userRole
  );

  const token = jwt.sign({ id: result.lastID, role: userRole, name }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: result.lastID, name, email, role: userRole } });
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Заполните все поля' });

  const db = await getDb();
  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  if (!user) return res.status(400).json({ error: 'Неверный email или пароль' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Неверный email или пароль' });

  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Get current user
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json(req.user);
});

export default router;
