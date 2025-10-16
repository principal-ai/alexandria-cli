/**
 * Tests for non-interactive mode
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import { createAddDocCommand } from '../../src/commands/add-doc';
import { createInitCommand } from '../../src/commands/init';

describe('CLI - non-interactive mode', () => {
  let tempDir: string;
  let originalCwd: string;

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
  });

  afterEach(() => {
    // Restore original cwd
    process.chdir(originalCwd);

    // Clean up environment variable
    delete process.env.ALEXANDRIA_HOME;

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should skip guidance in add-doc command with --yes flag', async () => {
    // Create a test markdown file
    fs.writeFileSync('TEST.md', '# Test Document\nThis is a test file.');

    // Capture console output
    const originalLog = console.log;
    const output: string[] = [];
    console.log = (...args) => output.push(args.join(' '));

    // Create and execute the command with --yes flag
    const command = createAddDocCommand();
    await command.parseAsync(['node', 'test', 'TEST.md', '--yes']);

    // Restore console.log
    console.log = originalLog;

    // Verify that guidance was skipped
    const fullOutput = output.join('\n');
    expect(fullOutput).not.toContain('📚 Adding Documentation to the Alexandria Library');
    expect(fullOutput).not.toContain('Press Enter to continue');
    expect(fullOutput).toContain('Documentation added to the Alexandria library');
  });

  it('should skip guidance in add-doc command with --non-interactive flag', async () => {
    // Create a test markdown file
    fs.writeFileSync('TEST.md', '# Test Document\nThis is a test file.');

    // Capture console output
    const originalLog = console.log;
    const output: string[] = [];
    console.log = (...args) => output.push(args.join(' '));

    // Create and execute the command with --non-interactive flag
    const command = createAddDocCommand();
    await command.parseAsync(['node', 'test', 'TEST.md', '--non-interactive']);

    // Restore console.log
    console.log = originalLog;

    // Verify that guidance was skipped
    const fullOutput = output.join('\n');
    expect(fullOutput).not.toContain('📚 Adding Documentation to the Alexandria Library');
    expect(fullOutput).not.toContain('Press Enter to continue');
    expect(fullOutput).toContain('Documentation added to the Alexandria library');
  });

  it('should show guidance in add-doc command without non-interactive flags', async () => {
    // Create a test markdown file
    fs.writeFileSync('TEST.md', '# Test Document\nThis is a test file.');

    // Capture console output
    const originalLog = console.log;
    const output: string[] = [];
    console.log = (...args) => output.push(args.join(' '));

    // Mock stdin to automatically "press enter"
    const originalStdin = process.stdin;
    const mockStdin = {
      once: (event: string, callback: () => void) => {
        if (event === 'data') {
          // Simulate pressing enter immediately
          process.nextTick(callback);
        }
      },
    };
    Object.defineProperty(process, 'stdin', {
      value: mockStdin,
      writable: true,
      configurable: true,
    });

    // Create and execute the command without flags
    const command = createAddDocCommand();
    await command.parseAsync(['node', 'test', 'TEST.md']);

    // Restore stdin and console.log
    process.stdin = originalStdin;
    console.log = originalLog;

    // Verify that guidance was shown
    const fullOutput = output.join('\n');
    expect(fullOutput).toContain('📚 Adding Documentation to the Alexandria Library');
    expect(fullOutput).toContain('Press Enter to continue');
  });

  it('should accept all defaults in init command with --yes flag', async () => {
    // Capture console output
    const originalLog = console.log;
    const originalError = console.error;
    const output: string[] = [];
    const errors: string[] = [];
    console.log = (...args) => output.push(args.join(' '));
    console.error = (...args) => errors.push(args.join(' '));

    // Create and execute the command with --yes flag
    const command = createInitCommand();
    // Use --no-agents, --no-hooks, --no-workflow to avoid external dependencies
    await command.parseAsync(['node', 'test', '--yes', '--no-agents', '--no-hooks', '--no-workflow']);

    // Restore console functions
    console.log = originalLog;
    console.error = originalError;

    // Verify that config was created
    expect(fs.existsSync('.alexandriarc.json')).toBe(true);

    // Verify output shows success
    const fullOutput = output.join('\n');
    expect(fullOutput).toContain('Alexandria initialized successfully');
  });
});
