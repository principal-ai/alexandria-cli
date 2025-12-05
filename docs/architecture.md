# Alexandria CLI Architecture

This document explains how the Alexandria CLI is architected and how its components work together.

## High-Level Architecture

Alexandria CLI is built on top of the `@a24z/core-library` package, which provides the core MemoryPalace functionality for storing and retrieving CodebaseViews. The CLI provides a command-line interface to interact with this underlying system.

### Dependency Stack

```
alexandria-cli (this package)
    ↓ uses
@a24z/core-library (MemoryPalace, validation, file system)
    ↓ uses
@a24z/markdown-utils (markdown parsing)
```

Key dependencies from `package.json`:

- `commander@^14.0.0` - CLI framework
- `@principal-ai/alexandria-core-library` - Core MemoryPalace functionality
- `@principal-ade/markdown-utils` - Markdown processing
- `chalk@^5.6.0` - Terminal styling
- `globby@^16.0.0` - File pattern matching

## Project Structure

```
src/
├── index.ts              # CLI entry point and command registration
├── commands/             # Command implementations (19 commands)
│   ├── init.ts          # Project initialization
│   ├── add-doc.ts       # Add documentation as views
│   ├── lint.ts          # Quality checking
│   ├── coverage.ts      # Coverage metrics
│   ├── validate.ts      # View validation
│   ├── list.ts          # List views
│   ├── save.ts          # Save views
│   ├── status.ts        # Project status
│   ├── agents.ts        # AGENTS.md management
│   ├── hooks.ts         # Git hook management
│   ├── projects.ts      # Project registry
│   ├── open.ts          # Open web editor
│   └── ... (more commands)
├── utils/                # Shared utilities
│   ├── repository.ts    # Repository operations
│   ├── validation.ts    # Validation utilities
│   ├── documentParser.ts # Markdown parsing
│   ├── viewCreation.ts  # View creation utilities
│   ├── coverage.ts      # Coverage calculation
│   ├── git.ts           # Git operations
│   └── formatting.ts    # Output formatting
└── templates/            # Template files
    └── alexandria-workflow.ts # GitHub Actions template
```

## Core Components

### CLI Entry Point

The `src/index.ts` file is the main entry point. It:

1. Creates a Commander.js program
2. Reads version from `package.json`
3. Registers all commands using factory functions
4. Parses command-line arguments
5. Shows help if no command is provided

```typescript
// Example from src/index.ts
const program = new Command();
program.name('alexandria').description('Alexandria CLI - Unified Context Management').version(packageJson.version);

// Add all commands
program.addCommand(createInitCommand());
program.addCommand(createListCommand());
// ... etc
```

### Command Pattern

All commands follow a consistent factory pattern defined in files like `src/commands/init.ts`, `src/commands/add-doc.ts`, etc:

1. Export a `create[Command]Command()` factory function
2. Create a Commander.js `Command` instance
3. Define options and arguments
4. Implement the action handler
5. Return the configured command

This pattern enables:

- **Testability**: Each command can be tested in isolation
- **Reusability**: Commands can be composed or extended
- **Type Safety**: TypeScript interfaces ensure correct option handling

### MemoryPalace Integration

The Alexandria CLI uses the MemoryPalace API from `@a24z/core-library` for all data operations. The `src/utils/repository.ts` provides helper functions:

```typescript
// Creates a MemoryPalace instance for a repository
export function createMemoryPalace(path?: string): MemoryPalace {
  const repoPath = getRepositoryRoot(path);
  const fileSystemAdapter = new NodeFileSystemAdapter();
  return new MemoryPalace(repoPath, fileSystemAdapter);
}
```

This abstraction ensures:

- Consistent repository path handling across commands
- Proper file system adapter initialization
- Centralized error handling for repository operations

### Document Parsing Pipeline

The `src/utils/documentParser.ts` implements markdown parsing to extract CodebaseView structure:

1. **Parse Markdown**: Extract headings, sections, and content
2. **Find File References**: Use regex patterns to identify file paths
3. **Validate Files**: Check if referenced files actually exist (using repository path)
4. **Build Reference Groups**: Organize files into logical sections
5. **Calculate Grid Layout**: Determine rows/cols based on sections (max 3 columns)

File patterns matched:

- Backticks: `` `src/index.ts` ``
- Bold: `**src/utils/helper.js**`
- Links: `[text](path/to/file.ts)`
- Plain paths: `src/components/Button.tsx`

### View Creation Flow

The `src/utils/viewCreation.ts` centralizes view creation logic used by multiple commands:

1. **Find Untracked Docs**: Scan repository for markdown files not in views
2. **Generate View Name**: Convert file path to readable name
3. **Parse Document**: Extract structure using `documentParser.ts`
4. **Create View Object**: Build CodebaseView with metadata
5. **Validate**: Check file references and structure
6. **Save**: Persist to `.alexandria/views/[view-id].json`

This shared logic ensures consistency between `add-doc`, `add-all-docs`, and other commands.

### Validation System

Validation happens at multiple levels, coordinated through `src/utils/validation.ts`:

1. **File-Level**: MemoryPalace validates each view's structure and file references
2. **Repository-Level**: `validateAllViews()` checks all views in a repository
3. **Lint-Level**: `src/commands/lint.ts` applies quality rules beyond basic validation

Validation results include:

- `isValid` boolean
- Issues array with severity levels (error, warning, info)
- Summary statistics (error count, warning count, etc.)

### Coverage Calculation

The `src/utils/coverage.ts` calculates what percentage of repository files have context:

1. **Find All Source Files**: Use globby to discover files (respecting .gitignore)
2. **Extract Referenced Files**: Collect all files mentioned in CodebaseViews
3. **Calculate Metrics**: Compare referenced vs. total files
4. **Group by Extension**: Break down coverage by file type (.ts, .js, .json, etc.)

Used by `src/commands/coverage.ts` to display coverage reports.

### Git Integration

The `src/utils/git.ts` provides git-related functionality:

- Get remote URL for repository registration
- Validate repository is a git repository
- Extract repository metadata

Used by `src/commands/init.ts` for project registration and `src/commands/install-workflow.ts` for GitHub Actions setup.

### Web Editor Integration

The `src/commands/open.ts` provides quick access to the Alexandria web editor:

- Parses git remote URL to extract owner/repo
- Opens browser to `https://app.principal-ade.com/{owner}/{repo}`
- Supports `--no-browser` flag to print URL only

## Build Process

The build system (defined in `package.json` scripts) uses a two-stage process:

1. **Library Build** (`build:lib`): TypeScript compilation with `tsconfig.build.json`
   - Compiles `src/**/*.ts` to `dist/`
   - Generates `.d.ts` type definitions
   - Preserves ES module format

2. **CLI Build** (`build:cli`): Custom build script in `build/build-cli.js`
   - Uses esbuild for bundling
   - Creates executable with proper shebang
   - Handles binary entry point

Output in `dist/` is what gets published to npm as `@a24z/alexandria-cli`.

## Configuration Management

Alexandria uses `.alexandriarc.json` for configuration (schema at `schema/alexandriarc.json`):

```json
{
  "$schema": "https://raw.githubusercontent.com/a24z-ai/alexandria-cli/main/schema/alexandriarc.json",
  "version": "1.0.0",
  "context": {
    "useGitignore": true,
    "patterns": {
      "exclude": [".alexandria/**"]
    },
    "rules": [
      // Lint rules configuration
    ]
  }
}
```

The `src/commands/schema.ts` command displays the schema and examples.

## Error Handling

Commands follow consistent error handling patterns:

1. **Try-Catch Blocks**: All command actions wrapped in try-catch
2. **Descriptive Messages**: Errors include context and suggestions
3. **Exit Codes**: `process.exit(1)` for errors, `0` for success
4. **User-Friendly Output**: Using chalk for colored terminal output

Example from `src/commands/init.ts`:

```typescript
try {
  // Command logic
} catch (error) {
  console.error('Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
```

## Testing Strategy

The project uses Bun's test runner (configured in `package.json`):

- Unit tests for utilities
- Integration tests for commands
- Coverage reporting via `bun test --coverage`

Lint and format checks:

- ESLint with TypeScript support (`eslint.config.js`)
- Prettier for formatting
- Husky for pre-commit hooks (`.husky/`)
- lint-staged for staged file checking (`.lintstagedrc.json`)

## Development Workflow

1. **Local Development**: `bun run dev` uses tsx to run TypeScript directly
2. **Building**: `bun run build` compiles to `dist/`
3. **Testing**: `bun test` runs test suite
4. **Linting**: `bun run lint` checks code quality
5. **Formatting**: `bun run format` applies Prettier
6. **Type Checking**: `bun run typecheck` validates TypeScript

The `src/commands/update.ts` command helps users update to the latest version of Alexandria CLI.

## Extension Points

Alexandria CLI is designed to be extensible:

- **New Commands**: Add to `src/commands/` and register in `src/index.ts`
- **New Lint Rules**: Extend the lint system in `src/commands/lint.ts`
- **Custom Templates**: Add to `src/templates/` directory
- **File System Adapters**: Swap NodeFileSystemAdapter for testing or alternative storage

All core functionality is accessible through the MemoryPalace API from `@a24z/core-library`, enabling integration with other tools in the a24z ecosystem.
