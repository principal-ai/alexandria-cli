/**
 * Repository utilities for CLI commands
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  MemoryPalace,
  ConfigLoader,
  filterByExcludePatterns as coreFilterByExcludePatterns,
  matchesPatterns,
} from '@principal-ai/alexandria-core-library';
import { NodeFileSystemAdapter, NodeGlobAdapter } from '@principal-ai/alexandria-core-library/node';
import type { AlexandriaConfig, GlobAdapter } from '@principal-ai/alexandria-core-library';

// Re-export core library utilities for convenience
export { getExcludePatterns } from '@principal-ai/alexandria-core-library';
export type { AlexandriaConfig };

// Singleton glob adapter for pattern matching
let _globAdapter: GlobAdapter | undefined;

function getGlobAdapter(): GlobAdapter {
  if (!_globAdapter) {
    _globAdapter = new NodeGlobAdapter();
  }
  return _globAdapter;
}

/**
 * Load the Alexandria config from the repository using ConfigLoader
 */
export function loadConfig(repoPath: string): AlexandriaConfig | null {
  const fsAdapter = new NodeFileSystemAdapter();
  const loader = new ConfigLoader(fsAdapter);
  return loader.loadConfig(repoPath);
}

/**
 * Check if a file path matches any of the exclude patterns
 */
export function isExcluded(filePath: string, excludePatterns: string[]): boolean {
  return matchesPatterns(getGlobAdapter(), excludePatterns, filePath);
}

/**
 * Filter files by exclude patterns from config
 */
export function filterByExcludePatterns(files: string[], excludePatterns: string[]): string[] {
  return coreFilterByExcludePatterns(getGlobAdapter(), files, excludePatterns);
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
