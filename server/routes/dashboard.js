import { Router } from 'express';
import { getStats, getChartData } from '../data/stats.js';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', (req, res) => {
  res.json(getStats());
});

dashboardRouter.get('/chart', (req, res) => {
  res.json(getChartData());
});
