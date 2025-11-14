/**
 * Git utility functions
 */

import { execSync } from 'child_process';
import type { ValidatedRepositoryPath } from '@principal-ai/alexandria-core-library';

/**
 * Get the git remote URL for a repository
 */
export function getGitRemoteUrl(repoPath: ValidatedRepositoryPath): string | undefined {
  try {
    const result = execSync('git config --get remote.origin.url', {
      cwd: repoPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return result.trim() || undefined;
  } catch {
    return undefined;
  }
}
