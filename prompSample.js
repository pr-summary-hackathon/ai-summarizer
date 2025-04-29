const basicPrompt = `Analyze this Pull Request and provide ONLY:

1. AUTHOR: [Name of the PR author]

2. SUMMARY: A brief 1-3 sentence description that captures the essence of the changes, focusing on what was modified and the scope/impact of the changes.

Example summary format: "This PR [adds/modifies/fixes] [specific component] by [specific change]. The changes are [scope assessment like 'minimal', 'focused on one component', 'across multiple systems']."

Do not include any other information.`;

module.exports = { basicPrompt };
