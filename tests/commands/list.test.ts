/**
 * Tests for the list command
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import { MemoryPalace } from '@principal-ai/alexandria-core-library';
import { NodeFileSystemAdapter } from '@principal-ai/alexandria-core-library/node';
import { createListCommand } from '../../src/commands/list';
import type { CodebaseView } from '@principal-ai/alexandria-core-library';

describe('CLI - list command', () => {
  let tempDir: string;
  let originalCwd: string;
  let fsAdapter: NodeFileSystemAdapter;
  let palace: MemoryPalace;

  beforeEach(() => {
    // Save original cwd
    originalCwd = process.cwd();

    // Create a temporary directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-test-'));

    // Set ALEXANDRIA_HOME to temp directory to isolate registry
    process.env.ALEXANDRIA_HOME = tempDir;

    // Initialize it as a git repo
    execSync('git init', { cwd: tempDir });

    // Change to temp directory
    process.chdir(tempDir);

    // Create MemoryPalace instance
    fsAdapter = new NodeFileSystemAdapter();
    palace = new MemoryPalace(tempDir, fsAdapter);
  });

  afterEach(() => {
    // Restore original cwd
    process.chdir(originalCwd);

    // Clean up environment variable
    delete process.env.ALEXANDRIA_HOME;

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should list views when views exist', () => {
    // Create some test views
    const view1: CodebaseView = {
      id: 'test-view-1',
      name: 'Test View 1',
      description: 'First test view',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      overviewPath: 'docs/test-view-1.md',
      category: 'test',
      displayOrder: 1,
      referenceGroups: {
        cell1: {
          coordinates: [0, 0],
          files: ['src/index.ts'],
        },
      },
      scope: {
        includePatterns: ['src/**/*.ts'],
        excludePatterns: ['**/*.test.ts'],
      },
    };

    const view2: CodebaseView = {
      id: 'test-view-2',
      name: 'Test View 2',
      description: 'Second test view',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      overviewPath: 'docs/test-view-2.md',
      category: 'test',
      displayOrder: 2,
      referenceGroups: {
        cell1: {
          coordinates: [0, 0],
          files: ['README.md'],
        },
        cell2: {
          coordinates: [0, 1],
          files: ['package.json', 'tsconfig.json'],
        },
      },
      scope: {
        includePatterns: ['**/*'],
        excludePatterns: [],
      },
    };

    // Save views
    palace.saveView(view1);
    palace.saveView(view2);

    // Capture console output
    const originalLog = console.log;
    const output: string[] = [];
    console.log = (...args) => output.push(args.join(' '));

    // Create and execute the command
    const command = createListCommand();
    command.parse(['node', 'test']);

    // Restore console.log
    console.log = originalLog;

    // Verify output
    expect(output.join('\n')).toContain('Found 2 codebase views:');
    expect(output.join('\n')).toContain('Test View 1 (test-view-1)');
    expect(output.join('\n')).toContain('First test view');
    expect(output.join('\n')).toContain('Test View 2 (test-view-2)');
    expect(output.join('\n')).toContain('Second test view');
    expect(output.join('\n')).toContain('Sections: 1');
    expect(output.join('\n')).toContain('Sections: 2');
  });

  it('should show appropriate message when no views exist', () => {
    // Capture console output
    const originalLog = console.log;
    const output: string[] = [];
    console.log = (...args) => output.push(args.join(' '));

    // Create and execute the command
    const command = createListCommand();
    command.parse(['node', 'test']);

    // Restore console.log
    console.log = originalLog;

    // Verify output
    expect(output.join('\n')).toContain('No codebase views found in this repository');
    expect(output.join('\n')).toContain('.alexandria/views');
  });

  it('should handle repository path option', () => {
    // Create a subdirectory
    const subDir = path.join(tempDir, 'subdirectory');
    fs.mkdirSync(subDir, { recursive: true });

    // Change to subdirectory
    process.chdir(subDir);

    // Create a view in the repo root
    const view: CodebaseView = {
      id: 'path-test-view',
      name: 'Path Test View',
      description: 'Testing path option',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      overviewPath: 'docs/path-test.md',
      category: 'test',
      displayOrder: 1,
      referenceGroups: {
        cell1: {
          coordinates: [0, 0],
          files: ['test.ts'],
        },
      },
      scope: {
        includePatterns: ['**/*'],
        excludePatterns: [],
      },
    };

    palace.saveView(view);

    // Capture console output
    const originalLog = console.log;
    const output: string[] = [];
    console.log = (...args) => output.push(args.join(' '));

    // Create and execute the command with path option pointing to repo root
    const command = createListCommand();
    command.parse(['node', 'test', '--path', tempDir]);

    // Restore console.log
    console.log = originalLog;

    // Verify output
    expect(output.join('\n')).toContain('Found 1 codebase view:');
    expect(output.join('\n')).toContain('Path Test View (path-test-view)');
  });

  it('should error when not in a git repository', () => {
    // Create a non-git directory
    const nonGitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'non-git-'));
    process.chdir(nonGitDir);

    // Capture console output
    const originalError = console.error;
    const originalExit = process.exit;
    const errors: string[] = [];
    let exitCode: number | undefined;

    console.error = (...args) => errors.push(args.join(' '));
    process.exit = ((code?: string | number) => {
      exitCode = typeof code === 'number' ? code : 1;
      return undefined as never;
    }) as typeof process.exit;

    // Create and execute the command
    const command = createListCommand();
    command.parse(['node', 'test']);

    // Restore console methods
    console.error = originalError;
    process.exit = originalExit;

    // Clean up
    process.chdir(originalCwd);
    fs.rmSync(nonGitDir, { recursive: true, force: true });

    // Verify error output
    expect(errors.join('\n')).toContain('Not in a git repository');
    expect(exitCode).toBe(1);
  });
});
