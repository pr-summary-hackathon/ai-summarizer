#!/usr/bin/env node
import axios from 'axios';
import { fetchPRDiff, formatPRSummary } from './diff_fetcher.js';
import { responseSample } from './pr_creation_content.js';
import { basicPrompt } from './prompSample.js';
import dotenv from 'dotenv';
dotenv.config();

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

async function main(): Promise<void> {
  try {
    const prSummary = await fetchPRDiff(responseSample);
    const formattedSummary = formatPRSummary(prSummary);
    const res = await askClaudeForSummary(formattedSummary);
    console.log(res);
  } catch (error) {
    console.error('Failed to process PR:', error);
  }
}

main().catch(console.error);
