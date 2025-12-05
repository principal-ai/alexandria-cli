# Alexandria CLI

Unified Context Management CLI for the Principal AI ecosystem. This tool provides command-line access to manage codebase views, documentation, and project context using the Alexandria knowledge management system.

## Installation

```bash
# Using npm
npm install -g @principal-ai/alexandria-cli

# Using bun
bun add -g @principal-ai/alexandria-cli
```

## Dependencies

This CLI depends on the `@principal-ai/alexandria-core-library` package which provides the core MemoryPalace functionality.

## Usage

### Initialize Alexandria in your project

```bash
alexandria init
```

### View project status

```bash
alexandria status
```

### Manage codebase views

```bash
# List all views
alexandria list

# Validate a view
alexandria validate <view-name>

# Save a new view
alexandria save <view-file>

# Add documentation as a view
alexandria add-doc <doc-file>
```

### Project management

```bash
# Register a project
alexandria projects register

# List registered projects
alexandria projects list
```

### Context coverage

```bash
# Check context coverage
alexandria coverage
```

### Web Editor

```bash
# Open the Alexandria web editor for this repository
alexandria open

# Print URL without opening browser
alexandria open --no-browser
```

## Development

This project uses Bun for package management and building.

### Setup

```bash
# Install dependencies
bun install

# Build the project
bun run build

# Run tests
bun test
```

### Project Structure

```
alexandria-cli/
├── src/
│   ├── index.ts           # Main CLI entry point
│   ├── commands/          # CLI command implementations
│   ├── utils/             # Utility functions
│   ├── api/               # API server implementation
│   └── templates/         # Template files
├── tests/                 # Test files
├── build/                 # Build scripts
└── dist/                  # Compiled output
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
