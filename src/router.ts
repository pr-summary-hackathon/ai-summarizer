import express, { Request, Response } from 'express';
import { summarizePr } from './antropic-api.js';
import fs from 'fs/promises';
import path from 'path';

// Create Express application
const app = express();
const PORT = 3000;

// Configure middleware to process JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Main route to verify the server is working
app.get('/', (_req: Request, res: Response) => {
  res.send('Server is running! Send POST requests to /api/data');
});

// POST route to receive data
app.post('/github-webhook', async (req: Request, res: Response) => {
  const event = req.headers['x-github-event'];
  if (event === 'pull_request' && req.body.action === 'opened') {
    try {
      const summary = await summarizePr(req.body.pull_request);
      const summaryData = {
        prNumber: req.body.pull_request.number,
        prTitle: req.body.pull_request.title,
        summary,
        timestamp: new Date().toISOString()
      };
      await fs.writeFile(
        path.join(process.cwd(), 'summary-response.json'),
        JSON.stringify(summaryData, null, 2)
      );
      console.log('PR Summary saved to summary-response.json');
    } catch (error) {
      console.error('Failed to summarize PR:', error);
    }
  }
  res.sendStatus(200);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('To expose with ngrok use: ngrok http 3000');
});