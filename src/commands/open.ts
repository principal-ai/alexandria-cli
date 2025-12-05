/**
 * Open command - Opens the Alexandria web editor for the current repository
 */

import { Command } from 'commander';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { getRepositoryRoot } from '../utils/repository.js';

const WEB_EDITOR_BASE_URL = 'https://app.principal-ade.com';

interface RepoInfo {
  owner: string;
  repo: string;
}

/**
 * Parse owner and repo from a git remote URL
 */
function parseGitRemote(remoteUrl: string): RepoInfo | undefined {
  // Handle SSH format: git@github.com:owner/repo.git
  if (remoteUrl.startsWith('git@github.com:')) {
    const path = remoteUrl.replace('git@github.com:', '').replace('.git', '');
    const parts = path.split('/');
    const owner = parts[0];
    const repo = parts[1];
    if (parts.length === 2 && owner && repo) {
      return { owner, repo };
    }
  }

  // Handle HTTPS format: https://github.com/owner/repo.git
  const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(\.git)?$/);
  if (match) {
    const owner = match[1];
    const repo = match[2];
    if (owner && repo) {
      return { owner, repo };
    }
  }

  return undefined;
}

/**
 * Get the git remote URL for the repository
 */
function getGitRemoteUrl(repoPath: string): string | undefined {
  try {
    const result = execSync('git remote get-url origin', {
      cwd: repoPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return result.trim() || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Open a URL in the default browser
 */
function openBrowser(url: string): void {
  const platform = process.platform;

  try {
    if (platform === 'darwin') {
      execSync(`open "${url}"`, { stdio: 'ignore' });
    } else if (platform === 'win32') {
      execSync(`start "" "${url}"`, { stdio: 'ignore' });
    } else {
      // Linux and others
      execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
    }
  } catch {
    throw new Error(`Failed to open browser. Please open manually: ${url}`);
  }
}

export function createOpenCommand(): Command {
  const command = new Command('open');

  command
    .description('Open the Alexandria web editor for this repository')
    .option('-p, --path <path>', 'Repository path (defaults to current directory)')
    .option('--no-browser', 'Print URL instead of opening browser')
    .action((options) => {
      try {
        const repoPath = getRepositoryRoot(options.path);

        // Get remote URL
        const remoteUrl = getGitRemoteUrl(repoPath);
        if (!remoteUrl) {
          console.error(chalk.red('No git remote found.'));
          console.log(chalk.dim('This command requires a GitHub remote to be configured.'));
          console.log(chalk.dim('Add one with: git remote add origin <url>'));
          process.exit(1);
        }

        // Parse owner/repo from remote
        const repoInfo = parseGitRemote(remoteUrl);
        if (!repoInfo) {
          console.error(chalk.red('Could not parse GitHub remote URL.'));
          console.log(chalk.dim(`Remote URL: ${remoteUrl}`));
          console.log(chalk.dim('Expected format: git@github.com:owner/repo.git or https://github.com/owner/repo'));
          process.exit(1);
        }

        const webEditorUrl = `${WEB_EDITOR_BASE_URL}/${repoInfo.owner}/${repoInfo.repo}`;

        if (options.browser === false) {
          console.log(webEditorUrl);
        } else {
          console.log(chalk.blue(`Opening Alexandria web editor for ${repoInfo.owner}/${repoInfo.repo}...`));
          openBrowser(webEditorUrl);
          console.log(chalk.dim(`URL: ${webEditorUrl}`));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}
