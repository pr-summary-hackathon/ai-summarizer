#!/usr/bin/env node
import axios from 'axios';
import { fetchPRDiff, formatPRSummary, PRResponse } from './diff_fetcher.js';
import { basicPrompt } from './prompSample.js';
import dotenv from 'dotenv';
dotenv.config();

// Define a type for the summary data payload for clarity
interface SummaryData {
  // prNumber: number; // Remove
  // prTitle: string; // Remove
  title: string; // Add combined title field
  url: string;   // Add URL field
  summary: string;
  timestamp: string;
}

// Main function to make request to Claude's API
async function askClaudeForSummary(summary: string): Promise<string> {
  let question = basicPrompt;
  question += `\n\nUse this PR content: \n\n${summary}`;
  // console.log(question);
  //return question;
  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || 'YOUR_API_KEY_HERE',
        'anthropic-version': '2023-06-01'
      },
      data: {
        model: 'claude-3-7-sonnet-20250219', // Latest model
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: question
          }
        ]
      }
    });
    return response.data.content[0].text;
  } catch (error: any) {
    console.error('Error querying Claude API:', error.response?.data || error.message);
    throw error;
  }
}

// Function to get the question from command line arguments
function getPromptFromArgs(): string {
  // Take all arguments after "node script.js"
  const args = process.argv.slice(2);

  // If no arguments provided, show help and exit
  if (args.length === 0) {
    console.log('Usage: node dist/antropic-api.js "Your question for Claude here"');
    process.exit(1);
  }

  // Join all arguments into a single string (in case the question has spaces)
  return args.join(' ');
}

export async function summarizePr(prResponse: PRResponse): Promise<string> {
  try {
    const prSummary = await fetchPRDiff(prResponse);
    const formattedSummary = formatPRSummary(prSummary);
    const res = await askClaudeForSummary(formattedSummary);
    return res;
  } catch (error) {
    console.error('Failed to process PR:', error);
    return 'Failed to summarize PR';
  }
}

// New function to send summary data to Slack
export async function sendSummaryToSlack(summaryData: SummaryData): Promise<void> {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) {
    console.error('Slack webhook URL not found in environment variables (SLACK_WEBHOOK_URL).');
    // Decide how to handle missing URL: throw error, log, or silently fail
    // For now, we'll log and return to avoid crashing the main process
    return; 
  }

  try {
    // Use Slack's link formatting: <URL|Link Text>
    const titleLink = `<${summaryData.url}|${summaryData.title}>`;
    await axios.post(slackWebhookUrl, {
      // Use blocks for better formatting (optional but recommended)
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*New PR Summary: ${titleLink}*`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Summary:*
${summaryData.summary}`
          }
        }
      ],
      // Fallback text for notifications
      text: `New PR Summary: ${titleLink} - Summary: ${summaryData.summary}`
    });
    console.log('Summary sent to Slack');
  } catch (slackError: any) {
    console.error('Failed to send summary to Slack:', slackError.response?.data || slackError.message);
    // Decide how to handle Slack errors: throw, log, etc.
    // For now, just logging the error
  }
}
