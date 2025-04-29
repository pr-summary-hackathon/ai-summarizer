import express, { Request, Response } from 'express';
import { summarizePr, sendSummaryToSlack } from './antropic-api.js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

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
      const pr = req.body.pull_request;
      const summary = await summarizePr(pr);

      // Create the combined title string
      const combinedTitle = `#${pr.number}: ${pr.title}`;

      const summaryData = {
        title: combinedTitle,
        url: pr.html_url,
        authorName: pr.user.login,
        authorIconUrl: pr.user.avatar_url,
        summary,
        timestamp: new Date().toISOString()
      };

      // Keep writing to file for debugging
      await fs.writeFile(
        path.join(process.cwd(), 'summary-response.json'),
        JSON.stringify(summaryData, null, 2)
      );
      console.log('PR Summary saved to summary-response.json');

      // Call the function from antropic-api.ts to send summary to Slack
      await sendSummaryToSlack(summaryData);

    } catch (error) {
      console.error('Failed to process webhook event:', error);
    }
  }
  res.sendStatus(200);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('To expose with ngrok use: ngrok http 3000');
});