import { Router } from 'express';
import { getUsers, deleteUsers } from '../data/users.js';

export const usersRouter = Router();

usersRouter.get('/', (req, res) => {
  if ((req.query.page !== undefined && !/^[1-9]\d{0,5}$/.test(req.query.page)) || (req.query.limit !== undefined && (!/^[1-9]\d?$/.test(req.query.limit) || Number(req.query.limit) > 50)) || (req.query.sort !== undefined && !['id', 'name', 'email', 'role', 'createdAt'].includes(req.query.sort)) || (req.query.order !== undefined && !['asc', 'desc'].includes(req.query.order))) return res.status(400).json({ error: 'Invalid pagination or sort parameters' });
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const sort = (req.query.sort || 'name').toString();
  const order = req.query.order === 'desc' ? 'desc' : 'asc';
  const result = getUsers({ page, limit, sort, order });
  res.json(result);
});

usersRouter.delete('/', (req, res, next) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 50 || ids.some((id) => !Number.isSafeInteger(id) || id < 1)) {
    return res.status(400).json({ error: 'ids must contain 1 to 50 positive integer IDs' });
  }
  try { res.json(deleteUsers([...new Set(ids)])); } catch (error) { next(error); }
});
