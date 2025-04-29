const axios = require('axios');

/**
 * Fetches and parses PR differences from a GitHub PR response
 * @param {Object} prResponse - The GitHub PR response object
 * @returns {Promise<Object>} A summary object containing PR details and diff
 */
async function fetchPRDiff(prResponse) {
  try {
    // Extract important PR metadata
    const {
      diff_url,
      title,
      body,
      additions,
      deletions,
      changed_files,
      html_url,
      user,
      created_at,
      updated_at,
      state
    } = prResponse;

    // Fetch the actual diff content using axios
    const diffResponse = await axios.get(diff_url, {
      headers: {
        'Accept': 'text/plain'
      }
    });

    // Axios automatically throws on non-2xx responses, but we'll add extra validation
    if (diffResponse.status !== 200) {
      throw new Error(`Failed to fetch diff: ${diffResponse.statusText}`);
    }

    const diffText = diffResponse.data; // With axios, we don't need to call .text()

    // Create a summary object with extended information
    const prSummary = {
      title,
      description: body || 'No description provided',
      url: html_url,
      author: user.login,
      status: {
        state,
        createdAt: new Date(created_at).toLocaleString(),
        lastUpdated: new Date(updated_at).toLocaleString()
      },
      stats: {
        filesChanged: changed_files,
        additions,
        deletions,
        totalChanges: additions + deletions
      },
      diffContent: diffText
    };

    return prSummary;
  } catch (error) {
    // Axios specific error handling
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response from server:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
}

/**
 * Formats the PR summary into a readable text format
 * @param {Object} prSummary - The PR summary object
 * @returns {string} Formatted summary text
 */
function formatPRSummary(prSummary) {
  return `
Pull Request Summary
===================
Title: ${prSummary.title}
Author: ${prSummary.author}
URL: ${prSummary.url}

Status
------
State: ${prSummary.status.state}
Created: ${prSummary.status.createdAt}
Last Updated: ${prSummary.status.lastUpdated}

Description
----------
${prSummary.description}

Change Statistics
---------------
Files Changed: ${prSummary.stats.filesChanged}
Additions: ${prSummary.stats.additions} (+)
Deletions: ${prSummary.stats.deletions} (-)
Total Changes: ${prSummary.stats.totalChanges}

Diff Content
-----------
${prSummary.diffContent}
`;
}

module.exports = { fetchPRDiff, formatPRSummary };
