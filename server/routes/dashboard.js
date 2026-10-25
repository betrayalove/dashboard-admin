import { Router } from 'express';
import { getStats, getChartData } from '../data/stats.js';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', (req, res) => {
  res.json(getStats());
});

dashboardRouter.get('/chart', (req, res) => {
  if (!['day', 'week', 'month'].includes(req.query.period || 'week')) return res.status(400).json({ error: 'Invalid period' });
  res.json(getChartData(req.query.period));
});
