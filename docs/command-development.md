# Command Development Guide

This guide explains how to understand, modify, or create CLI commands for Alexandria. It covers the command architecture, common patterns, and development workflow.

## Command Architecture

All Alexandria commands follow a factory pattern. Each command is defined in `src/commands/[command-name].ts` and exports a factory function that returns a configured Commander.js `Command` instance.

### Basic Command Structure

```typescript
// Template from src/commands/*.ts
import { Command } from 'commander';

export function createExampleCommand(): Command {
  const command = new Command('example');

  command
    .description('What this command does')
    .option('-f, --flag', 'Optional flag')
    .argument('[required]', 'Required argument')
    .action(async (argument, options) => {
      try {
        // Command implementation
        console.log('Success!');
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}
```

### Command Registration

Commands are registered in `src/index.ts`:

```typescript
// From src/index.ts
import { createExampleCommand } from './commands/example.js';

const program = new Command();
program.addCommand(createExampleCommand());
```

The `.js` extension in imports is required for ES modules.

## Command Categories

Alexandria has several command categories:

### Setup Commands

**init** (`src/commands/init.ts`)

- Initialize `.alexandriarc.json` configuration
- Register project in global registry
- Optionally set up AGENTS.md, hooks, GitHub workflow
- Pattern: Interactive with prompts using `readline`

**status** (`src/commands/status.ts`)

- Show current configuration state
- Display stats about views and documents
- Pattern: Read-only, formatted output

**agents** (`src/commands/agents.ts`)

- Manage AGENTS.md guidance for AI assistants
- Add/remove/check Alexandria section
- Pattern: File manipulation with checks

**hooks** (`src/commands/hooks.ts`)

- Manage husky pre-commit hooks
- Add/remove Alexandria validation
- Pattern: File manipulation in `.husky/`

### View Management Commands

**add-doc** (`src/commands/add-doc.ts`)

- Add single documentation file as CodebaseView
- Interactive guidance (unless `--skip-guidance`)
- Pattern: Complex with validation and user feedback

**add-all-docs** (`src/commands/add-all-docs.ts`)

- Batch add all untracked documentation
- Uses `src/utils/viewCreation.ts` for bulk operations
- Pattern: Batch processing with progress reporting

**save** (`src/commands/save.ts`)

- Save a manually-created view JSON file
- Validate structure before saving
- Pattern: File I/O with validation

**list** (`src/commands/list.ts`)

- List all CodebaseViews in repository
- Support filtering by category
- Pattern: Query and formatted output

**list-untracked-docs** (`src/commands/list-untracked-docs.ts`)

- Find markdown files not yet in views
- Uses `src/utils/viewCreation.ts::findUntrackedDocuments()`
- Pattern: File system scanning

### Validation Commands

**validate** (`src/commands/validate.ts`)

- Validate a specific view by ID or name
- Show detailed validation issues
- Pattern: Query with detailed error reporting

**validate-all** (`src/commands/validate-all.ts`)

- Validate all views in repository
- Uses `src/utils/validation.ts::validateAllViews()`
- Pattern: Batch validation with summary

**lint** (`src/commands/lint.ts`)

- Check quality issues beyond basic validation
- Support `--fix` for auto-fixing
- Pattern: Rule engine with configurable severity

### Metrics Commands

**coverage** (`src/commands/coverage.ts`)

- Calculate context coverage metrics
- Uses `src/utils/coverage.ts`
- Support `--verbose`, `--by-extension`, `--json` output
- Pattern: Calculation and formatted reporting

### Utility Commands

**projects** (`src/commands/projects.ts`)

- Manage global project registry
- Subcommands: register, list, go, remove
- Pattern: Subcommand with storage in home directory

**schema** (`src/commands/schema.ts`)

- Display JSON schema and examples
- Support different output formats (json, typescript, markdown)
- Pattern: Template rendering

**update** (`src/commands/update.ts`)

- Update Alexandria CLI to latest version
- Uses npm/bun to update package
- Pattern: Shell execution

**outpost** (`src/commands/outpost.ts`)

- Manage Alexandria API server
- Uses `src/api/AlexandriaOutpostManager.ts`
- Subcommands: start, stop, status
- Pattern: Process management

**install-workflow** (`src/commands/install-workflow.ts`)

- Install GitHub Actions workflow
- Uses template from `src/templates/alexandria-workflow.ts`
- Pattern: File generation from template

**fix-overview-paths** (`src/commands/fix-overview-paths.ts`)

- Fix incorrect overview paths in views
- Auto-detect and correct path issues
- Pattern: Automated repair

## Common Patterns

### Repository Path Handling

Most commands need repository access. Use helpers from `src/utils/repository.ts`:

```typescript
import { createMemoryPalace, getRepositoryRoot } from '../utils/repository.js';

// In command action
const palace = createMemoryPalace(options.path);
const repoPath = getRepositoryRoot(options.path);
```

This handles:

- Default to current directory if no `--path` option
- Validate it's a git repository
- Create MemoryPalace instance with proper file system adapter

### Validation Pattern

Commands that validate views use `src/utils/validation.ts`:

```typescript
import { validateAllViews } from '../utils/validation.js';

const summary = validateAllViews(repoPath);

if (summary.invalidViews > 0) {
  // Handle validation failures
  process.exit(1);
}
```

Returns `ValidationSummary` with:

- Total view counts
- Error/warning/info counts
- Detailed results per view

### Output Formatting

Use helpers from `src/utils/formatting.ts` for consistent output:

```typescript
import chalk from 'chalk';

console.log(chalk.green('✅ Success!'));
console.log(chalk.yellow('⚠️  Warning'));
console.log(chalk.red('❌ Error'));
```

Common patterns:

- Emojis for visual clarity
- Colors for severity (green = success, yellow = warning, red = error)
- Dividers: `═══════════════════════════════════════════`
- Bullets: `•`, `→`, `✓`

### Interactive Prompts

For user interaction, use readline (see `src/commands/init.ts`):

```typescript
import * as readline from 'node:readline';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function promptYesNo(question: string, defaultValue = true): Promise<boolean> {
  const defaultText = defaultValue ? 'Y/n' : 'y/N';
  const answer = await prompt(`${question} (${defaultText}): `);

  if (answer === '') return defaultValue;
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}
```

### Non-Interactive Mode

Support `--yes` or `--non-interactive` flags (see `src/commands/init.ts`, `src/commands/add-doc.ts`):

```typescript
const nonInteractive = options.yes || options.nonInteractive;

if (nonInteractive) {
  // Skip prompts, use defaults
} else {
  // Show prompts
  const answer = await promptYesNo('Continue?', true);
}
```

### Error Handling

Consistent error handling across all commands:

```typescript
try {
  // Command logic
  // Success - no explicit exit needed
} catch (error) {
  console.error('Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
```

Key points:

- Always wrap main logic in try-catch
- Extract message from Error objects
- Exit with code 1 on failure
- Use descriptive error messages

### File System Operations

Use Node.js fs module, but consider validation:

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';

// Check existence
if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

// Read with error handling
try {
  const content = fs.readFileSync(filePath, 'utf8');
} catch (error) {
  console.error('Cannot read file:', error);
  process.exit(1);
}
```

### Git Operations

Use helpers from `src/utils/git.ts`:

```typescript
import { getGitRemoteUrl } from '../utils/git.js';

const remoteUrl = getGitRemoteUrl(repoPath);
if (remoteUrl) {
  console.log('Remote:', remoteUrl);
}
```

This uses `child_process.execSync` to run git commands.

### Coverage Calculation

Use `src/utils/coverage.ts` for coverage metrics:

```typescript
import { calculateCoverage } from '../utils/coverage.js';

const coverage = await calculateCoverage(repoPath);

console.log(`Coverage: ${coverage.percentage.toFixed(1)}%`);
console.log(`Files with context: ${coverage.filesWithContext.size}`);
console.log(`Total source files: ${coverage.totalSourceFiles}`);
```

Returns:

- `totalSourceFiles`: Count of all source files
- `filesWithContext`: Set of files referenced in views
- `percentage`: Coverage percentage
- `byExtension`: Breakdown by file type
- `uncoveredFiles`: Files without context

## Creating a New Command

Follow these steps to add a new command:

### 1. Create Command File

Create `src/commands/my-command.ts`:

```typescript
import { Command } from 'commander';
import { createMemoryPalace, getRepositoryRoot } from '../utils/repository.js';

export function createMyCommand(): Command {
  const command = new Command('my-command');

  command
    .description('Description of my command')
    .option('-p, --path <path>', 'Repository path (defaults to current directory)')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options) => {
      try {
        const palace = createMemoryPalace(options.path);
        const repoPath = getRepositoryRoot(options.path);

        // Implement command logic here

        console.log('✅ Command completed successfully');
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}
```

### 2. Register Command

Add to `src/index.ts`:

```typescript
import { createMyCommand } from './commands/my-command.js';

// In the command registration section
program.addCommand(createMyCommand());
```

### 3. Add Tests

Create `tests/my-command.test.ts`:

```typescript
import { describe, it, expect } from 'bun:test';
import { createMyCommand } from '../src/commands/my-command';

describe('my-command', () => {
  it('should create command', () => {
    const command = createMyCommand();
    expect(command.name()).toBe('my-command');
  });

  // Add more tests
});
```

### 4. Update Documentation

Update `README.md` to document the new command.

## Development Workflow

### Local Development

```bash
# Run command directly with tsx
bun run dev [command] [args]

# This executes: tsx src/index.ts [command] [args]
```

Example:

```bash
bun run dev list --path ~/my-project
```

### Building

```bash
# Clean and build
bun run build

# This runs:
# 1. bun run clean (removes dist/)
# 2. bun run build:lib (TypeScript compilation)
# 3. bun run build:cli (esbuild bundling)
```

### Testing

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch
```

### Linting and Formatting

```bash
# Check lint issues
bun run lint

# Auto-fix lint issues
bun run lint:fix

# Check formatting
bun run format:check

# Apply formatting
bun run format

# Type checking
bun run typecheck
```

### Debugging

Add debug output:

```typescript
if (options.verbose) {
  console.log('Debug:', JSON.stringify(data, null, 2));
}
```

Use VSCode debugger:

1. Set breakpoint in source file
2. Run debug configuration
3. Step through code

## Best Practices

### Command Options

- Use `--path` for repository path (standardized across commands)
- Use `--verbose` or `-v` for detailed output
- Use `--json` for machine-readable output
- Use `--yes` or `-y` for non-interactive mode
- Use `--dry-run` for preview without changes

### Help Text

Provide clear descriptions:

```typescript
command
  .description('Clear, concise description')
  .option('-f, --format <type>', 'Format type: json, yaml, or text (default: text)', 'text')
  .argument('<input>', 'Input file path');
```

### Validation

Validate early:

```typescript
// Validate arguments before processing
if (!fs.existsSync(inputFile)) {
  console.error(`Error: Input file not found: ${inputFile}`);
  process.exit(1);
}

// Validate options
if (!['json', 'yaml', 'text'].includes(options.format)) {
  console.error(`Error: Invalid format. Must be json, yaml, or text`);
  process.exit(1);
}
```

### User Feedback

Provide progress feedback for long operations:

```typescript
console.log('🔍 Scanning repository...');
const files = await scanFiles();

console.log(`📊 Found ${files.length} files`);
console.log('🔄 Processing...');

// Process files...

console.log('✅ Complete!');
```

### Error Messages

Be specific about what went wrong and how to fix it:

```typescript
// Bad
console.error('Error: Failed');

// Good
console.error('Error: Cannot read view file');
console.error('  File: .alexandria/views/my-view.json');
console.error('  Reason: File does not exist');
console.error('  Suggestion: Run `alexandria list` to see available views');
```

## Common Tasks

### Reading a View

```typescript
const palace = createMemoryPalace(options.path);
const views = palace.listViews();
const view = views.find((v) => v.id === viewId);

if (!view) {
  console.error(`View not found: ${viewId}`);
  process.exit(1);
}
```

### Modifying a View

```typescript
view.description = 'Updated description';
palace.saveView(view);
```

### Creating a View from Scratch

```typescript
import { generateViewIdFromName } from '@a24z/core-library';
import type { CodebaseView } from '@a24z/core-library';

const view: CodebaseView = {
  id: generateViewIdFromName('My View'),
  version: '1.0.0',
  name: 'My View',
  description: 'Description',
  rows: 1,
  cols: 1,
  referenceGroups: {},
  overviewPath: 'docs/my-view.md',
  category: 'documentation',
  displayOrder: 0,
  timestamp: new Date().toISOString(),
  metadata: {
    generationType: 'user',
    ui: {
      enabled: true,
      rows: 1,
      cols: 1,
      showCellLabels: true,
      cellLabelPosition: 'top',
    },
  },
};

palace.saveViewWithValidation(view);
```

### Executing Shell Commands

```typescript
import { execSync } from 'node:child_process';

try {
  const output = execSync('git status', {
    cwd: repoPath,
    encoding: 'utf8',
  });
  console.log(output);
} catch (error) {
  console.error('Command failed:', error);
}
```

## Integration with Core Library

Alexandria CLI uses `@a24z/core-library` extensively:

```typescript
// Import types
import type { CodebaseView, ValidatedRepositoryPath } from '@a24z/core-library';

// Import classes
import { MemoryPalace, NodeFileSystemAdapter } from '@a24z/core-library';

// Import utilities
import { generateViewIdFromName, ALEXANDRIA_DIRS } from '@a24z/core-library';
```

Key APIs:

- `MemoryPalace`: Main class for view storage and retrieval
- `NodeFileSystemAdapter`: File system operations
- `ProjectRegistryStore`: Global project registry
- Validation functions
- Path utilities

Refer to `@a24z/core-library` documentation for detailed API reference.

## Troubleshooting

### Command Not Found

Ensure command is:

1. Exported from `src/commands/[name].ts`
2. Imported in `src/index.ts`
3. Added with `program.addCommand()`
4. Built with `bun run build`

### TypeScript Errors

Check:

1. Imports use `.js` extension (for ES modules)
2. Types are imported with `import type {}`
3. `tsconfig.json` is properly configured

### Runtime Errors

Common issues:

- File paths: Use `path.join()` or `path.resolve()`
- Async operations: Use `async/await` properly
- Error handling: Wrap in try-catch blocks

## Example: Complete Command

Here's `src/commands/coverage.ts` as a complete example showing all patterns:

- Repository path handling
- Options parsing
- Coverage calculation using utils
- Formatted output
- JSON output option
- Verbose mode
- Error handling
- Exit codes

Study this command to understand real-world implementation of all the patterns described in this guide.
