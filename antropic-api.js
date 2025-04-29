#!/usr/bin/env node
const axios = require('axios');
require('dotenv').config(); // To load environment variables

// Main function to make request to Claude's API
async function askClaude(prompt) {
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
            content: prompt
          }
        ]
      }
    });

    // Display the response
    console.log('Claude\'s Response:');
    console.log(response.data.content[0].text);
    return response.data;
  } catch (error) {
    console.error('Error querying Claude API:', error.response?.data || error.message);
    throw error;
  }
}

// Function to get the question from command line arguments
function getPromptFromArgs() {
  // Take all arguments after "node script.js"
  const args = process.argv.slice(2);

  // If no arguments provided, show help and exit
  if (args.length === 0) {
    console.log('Usage: node script.js "Your question for Claude here"');
    process.exit(1);
  }

  // Join all arguments into a single string (in case the question has spaces)
  return args.join(' ');
}

// Example usage
async function main() {
  const prompt = getPromptFromArgs();

  console.log(`Sending prompt: "${prompt}"`);
  await askClaude(prompt);
}

main().catch(console.error);
