import { Router } from 'express';
import { getUsers } from '../data/users.js';

export const usersRouter = Router();

usersRouter.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const sort = (req.query.sort || 'name').toString();
  const order = req.query.order === 'desc' ? 'desc' : 'asc';
  const result = getUsers({ page, limit, sort, order });
  res.json(result);
});
