/**
 * Repository utilities for CLI commands
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { MemoryPalace, CONFIG_FILENAME } from '@principal-ai/alexandria-core-library';
import { NodeFileSystemAdapter } from '@principal-ai/alexandria-core-library/node';
import { minimatch } from 'minimatch';

export interface AlexandriaConfig {
  version?: string;
  context?: {
    useGitignore?: boolean;
    patterns?: {
      exclude?: string[];
    };
  };
}

/**
 * Load the Alexandria config from the repository
 */
export function loadConfig(repoPath: string): AlexandriaConfig | null {
  const configPath = path.join(repoPath, CONFIG_FILENAME);
  if (!fs.existsSync(configPath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(content) as AlexandriaConfig;
  } catch {
    return null;
  }
}

/**
 * Get exclude patterns from the config
 */
export function getExcludePatterns(config: AlexandriaConfig | null): string[] {
  return config?.context?.patterns?.exclude ?? [];
}

/**
 * Check if a file path matches any of the exclude patterns
 */
export function isExcluded(filePath: string, excludePatterns: string[]): boolean {
  return excludePatterns.some((pattern) => minimatch(filePath, pattern, { dot: true }));
}

/**
 * Filter files by exclude patterns from config
 */
export function filterByExcludePatterns(files: string[], excludePatterns: string[]): string[] {
  if (excludePatterns.length === 0) {
    return files;
  }
  return files.filter((file) => !isExcluded(file, excludePatterns));
}

/**
 * Find the git repository root from a given path
 */
export function findRepositoryRoot(startPath: string = process.cwd()): string | null {
  let currentPath = path.resolve(startPath);

  while (currentPath !== path.dirname(currentPath)) {
    if (fs.existsSync(path.join(currentPath, '.git'))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }

  return null;
}

/**
 * Create a MemoryPalace instance for the current repository
 */
export function createMemoryPalace(searchPath?: string): MemoryPalace {
  const repoPath = findRepositoryRoot(searchPath || process.cwd());

  if (!repoPath) {
    throw new Error('Not in a git repository. Please run this command from within a git repository.');
  }

  const fsAdapter = new NodeFileSystemAdapter();
  return new MemoryPalace(repoPath, fsAdapter);
}

/**
 * Get the repository root path, throwing an error if not found
 */
export function getRepositoryRoot(searchPath?: string): string {
  const repoPath = findRepositoryRoot(searchPath || process.cwd());

  if (!repoPath) {
    throw new Error('Not in a git repository. Please run this command from within a git repository.');
  }

  return repoPath;
}
