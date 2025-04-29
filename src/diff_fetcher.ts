import axios from 'axios';

export interface User {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
}

export interface PRResponse {
  url: string;
  id: number;
  node_id: string;
  html_url: string;
  diff_url: string;
  patch_url: string;
  issue_url: string;
  number: number;
  state: string;
  locked: boolean;
  title: string;
  user: User;
  body?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  merged_at?: string | null;
  merge_commit_sha?: string | null;
  assignee?: any;
  assignees?: any[];
  requested_reviewers?: any[];
  requested_teams?: any[];
  labels?: any[];
  milestone?: any;
  draft?: boolean;
  commits_url: string;
  review_comments_url: string;
  review_comment_url: string;
  comments_url: string;
  statuses_url: string;
  head?: any;
  base?: any;
  _links?: any;
  author_association?: string;
  auto_merge?: any;
  active_lock_reason?: any;
  merged?: boolean;
  mergeable?: boolean | null;
  rebaseable?: boolean | null;
  mergeable_state?: string;
  merged_by?: any;
  comments: number;
  review_comments: number;
  maintainer_can_modify?: boolean;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface PRSummary {
  title: string;
  description: string;
  url: string;
  author: string;
  status: {
    state: string;
    createdAt: string;
    lastUpdated: string;
  };
  stats: {
    filesChanged: number;
    additions: number;
    deletions: number;
    totalChanges: number;
  };
  diffContent: string;
}

/**
 * Fetches and parses PR differences from a GitHub PR response
 * @param {Object} prResponse - The GitHub PR response object
 * @returns {Promise<Object>} A summary object containing PR details and diff
 */
export async function fetchPRDiff(prResponse: PRResponse): Promise<PRSummary> {
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
    const prSummary: PRSummary = {
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
  } catch (error: any) {
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
export function formatPRSummary(prSummary: PRSummary): string {
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
