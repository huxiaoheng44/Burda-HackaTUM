import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { z } from 'zod';
import { NewsRepository } from './db';
import { fetchAndStoreFeeds } from './rss';
import { UPDATE_INTERVAL } from '../config/rss';
import { logger } from './logger';

const app = express();
app.use(cors());
app.use(express.json());

const filterSchema = z.object({
  category: z.string().optional(),
  timeFrame: z.enum(['24h', '7d', '30d', 'all']).optional()
});

const repo = new NewsRepository();

app.get('/api/articles', (req, res) => {
  try {
    const filters = filterSchema.parse(req.query);
    const articles = repo.getArticles(filters);
    res.json(articles);
  } catch (error) {
    logger.error('Error handling /api/articles:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

app.post('/api/articles/:id/view', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    repo.incrementViews(id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error handling view increment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/articles/:id/share', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    repo.incrementShares(id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error handling share increment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initial feed fetch
fetchAndStoreFeeds().catch(error => {
  logger.error('Initial feed fetch failed:', error);
});

// Schedule periodic updates
cron.schedule(UPDATE_INTERVAL, () => {
  logger.info('Running scheduled feed update');
  fetchAndStoreFeeds().catch(error => {
    logger.error('Scheduled feed fetch failed:', error);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});