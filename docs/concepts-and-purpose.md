# Alexandria Concepts & Purpose

Alexandria CLI is a unified context management system designed to bridge the gap between human developers and AI assistants when working with codebases.

## The Problem

AI agents struggle with codebases because:

- **Lost in the Noise**: They see thousands of files but don't know which ones matter
- **No Relationships**: File lists don't explain how components relate to each other
- **Stale Documentation**: README files go out of date, and there's no way to validate them
- **Context Overload**: Providing all relevant context requires manually copying dozens of file paths

Traditional documentation becomes outdated quickly because there's no validation mechanism to ensure file references are current.

## The Solution: Structured Context Management

Alexandria solves this through **CodebaseViews** - structured, validated representations of your codebase that explicitly define:

1. **What files matter** for specific aspects of your project
2. **How they relate** to each other through logical groupings
3. **When they change** through automatic staleness detection
4. **Whether they exist** through continuous validation

Key configuration in `.alexandriarc.json` defines project-wide context rules.

## Core Concepts

### Context Library

The Alexandria library (stored in `.alexandria/views/`) maintains validated documentation with explicit file references. Unlike traditional docs, these views are:

- **Validated**: The `src/utils/validation.ts` ensures all file references exist
- **Structured**: Organized in a grid layout with reference groups
- **Versioned**: Tracked with timestamps in the view JSON
- **Coverage-Aware**: The `src/utils/coverage.ts` tracks what percentage of your codebase has context

### File References and Relationships

Each CodebaseView contains reference groups that associate documentation sections with actual source files. The `src/utils/documentParser.ts` automatically extracts these references from markdown:

```markdown
## Authentication System

The authentication logic is implemented in `src/auth/provider.ts` and `src/auth/session.ts`.
```

This gets parsed into a reference group that tells AI agents: "When working on authentication, these are the files to examine."

### Coverage Metrics

Coverage measures how much of your codebase has structured context. Run `alexandria coverage` to see metrics calculated by `src/utils/coverage.ts`:

- **Total source files**: All files in your repository (respecting .gitignore)
- **Files with context**: Files referenced in at least one CodebaseView
- **Coverage percentage**: The ratio of documented to total files

High coverage means AI agents can find relevant context for most parts of your codebase.

### The Alexandria Workflow

1. **Initialize** (`src/commands/init.ts`): Set up configuration and project registry
2. **Add Documentation** (`src/commands/add-doc.ts`): Convert markdown docs into validated CodebaseViews
3. **Validate** (`src/commands/validate.ts`): Ensure all file references are current
4. **Lint** (`src/commands/lint.ts`): Check for quality issues like orphaned references or stale content
5. **Monitor** (`src/commands/coverage.ts`): Track coverage metrics over time

The `src/index.ts` registers all these commands using commander.js.

## Use Cases

### Onboarding New Developers

New team members can run `alexandria list` to see all available CodebaseViews, then use them to understand:

- Where is feature X implemented?
- Which files work together?
- What's the overall architecture?

### AI Pair Programming

AI assistants can query the Alexandria library to get structured context about:

- Relevant files for a specific task
- How components interact
- Architectural patterns and conventions

The `src/api/AlexandriaOutpostManager.ts` provides an API server for programmatic access.

### Documentation Maintenance

The lint system (`src/commands/lint.ts`) automatically detects:

- **Orphaned references**: Files mentioned in docs that no longer exist
- **Stale references**: Documentation that hasn't been updated since referenced files changed
- **Missing documentation**: Important files with no context coverage

This makes documentation a first-class citizen that's validated like code.

### Project Handoffs

When transitioning a project, Alexandria provides:

- Comprehensive file mapping through CodebaseViews
- Validation that all referenced files exist
- Coverage metrics to identify documentation gaps

## Goals & Vision

**Short-term Goals:**

- Make codebase context accessible and maintainable
- Validate documentation automatically
- Provide coverage metrics to track quality

**Long-term Vision:**

- Unified context management across the entire a24z ecosystem
- AI agents that can navigate any codebase through structured context
- Documentation that stays current through automated validation
- Seamless human-AI collaboration enabled by shared context

Alexandria is part of the larger a24z project, leveraging `@a24z/core-library` for the underlying MemoryPalace functionality that stores and retrieves CodebaseViews.

## Getting Started

To start using Alexandria in your project:

```bash
# Initialize configuration
alexandria init

# Check current status
alexandria status

# Add your first documentation
alexandria add-doc README.md

# Check coverage
alexandria coverage

# Validate everything
alexandria validate-all
```

The `src/commands/status.ts` provides a comprehensive overview of your Alexandria setup, including configuration, AI guidance, git hooks, and repository statistics.
