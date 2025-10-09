# Alexandria CLI - AI Assistant Enhancements

This document tracks improvements to make Alexandria CLI more AI-assistant friendly based on user feedback.

## Status: Alpha Release

Since we're in alpha, we can make breaking changes to improve clarity and usability.

## ✅ Completed Enhancements

### Summary

All critical AI-assistant improvements have been implemented:

1. **Clear Field Naming**: Changed `cells` to `referenceGroups` throughout the codebase
2. **Non-Interactive Mode**: Added `--yes`/`--non-interactive` flags to all commands
3. **Schema Documentation**: New `alexandria schema` command shows JSON structure with examples
4. **Enhanced Dry-Run**: `--dry-run` now shows complete JSON structure
5. **JSON Output**: All list/validate commands support `--json` for machine-readable output
6. **Better Error Messages**: Validation errors now include helpful examples and correct formats

### Example Usage for AI Assistants

```bash
# Create views without prompts
alexandria add-doc README.md --yes --dry-run

# Get schema information
alexandria schema --format json
alexandria schema --example full

# Machine-readable outputs
alexandria list --json
alexandria validate my-view --json
alexandria list-untracked-docs --json

# Non-interactive initialization
alexandria init --yes --no-workflow
```

## Priority 1: Critical Improvements (Immediate Impact)

### 1. Schema Command with Clear Examples ✅ Planned

**Problem**: AI assistants don't know the exact structure format without seeing examples.
**Solution**: Add `alexandria schema` command that shows JSON structure with clear naming.

```bash
alexandria schema [--format json|typescript|markdown]
```

**Example Output** (with new clearer naming):

```json
{
  "id": "view-id",
  "name": "Architecture Overview",
  "description": "System architecture documentation",
  "rows": 2,
  "cols": 3,
  "referenceGroups": {
    "Authentication": {
      "coordinates": [0, 0],
      "files": ["src/auth/provider.ts", "src/auth/middleware.ts"],
      "priority": 0
    },
    "API Layer": {
      "coordinates": [0, 1],
      "files": ["src/api/routes/index.ts", "src/api/controllers/*.ts"],
      "priority": 1
    }
  }
}
```

**Note**: Internally keeps `cells` as `CodebaseViewFileCell` type, but exposes as `referenceGroups` in user-facing interfaces.

### 2. Non-Interactive Mode ✅ Planned

**Problem**: Need workarounds like `echo "" |` for programmatic use.
**Solution**: Add `--non-interactive` or `-y/--yes` flag to all commands.

```bash
alexandria add-doc README.md --non-interactive
alexandria add-all-docs --yes
```

### 3. Enhanced Dry-Run Output ✅ Planned

**Problem**: `--dry-run` only shows summary, not the actual JSON structure.
**Solution**: Show complete JSON that would be created.

```bash
alexandria add-doc README.md --dry-run
# Should output the complete JSON structure that would be saved
```

## Priority 2: High-Value Enhancements

### 4. JSON Output for All Commands ✅ Planned

**Problem**: No machine-readable output for integration with other tools.
**Solution**: Add `--json` flag to all commands.

```bash
alexandria list --json
alexandria validate --json
alexandria list-untracked-docs --json
```

### 5. Better Validation Messages with Examples ✅ Planned

**Problem**: Validation errors don't show correct format examples.
**Solution**: Include working examples in error messages.

```
Error: Invalid referenceGroups format at line 15
Expected format:
{
  "Group Name": {
    "coordinates": [row, col],
    "files": ["path/to/file1.ts", "path/to/file2.ts"]
  }
}
```

### 6. Auto-Parse Markdown Structure Indicators 🔄 In Design

**Problem**: Manual creation of JSON structure is tedious.
**Solution**: Recognize structure indicators in markdown.

```markdown
## Authentication [0,0]

Files: `src/auth/provider.ts`, `src/auth/middleware.ts`

## API Layer [0,1]

- src/api/routes/index.ts
- src/api/controllers/\*.ts
```

## Priority 3: Nice-to-Have Features

### 7. Template Command 📋 Future

**Problem**: Starting from scratch is difficult.
**Solution**: Provide starter templates.

```bash
alexandria create-template authentication
alexandria create-template api-documentation
alexandria create-template database-schema
```

### 8. Extract Structure from Existing Docs 📋 Future

**Problem**: Existing documentation needs manual conversion.
**Solution**: Auto-extract structure from existing markdown.

```bash
alexandria extract-structure docs/ARCHITECTURE.md
```

### 9. Example Command 📋 Future

**Problem**: Need to see working examples quickly.
**Solution**: Show complete example views.

```bash
alexandria show-example
alexandria show-example --type authentication
```

## Implementation Plan

### Phase 1: Foundation (Completed ✅)

1. ✅ Create this enhancement document
2. ✅ Update codebase to use referenceGroups field name
3. ✅ Add --non-interactive flag
4. ✅ Create schema command
5. ✅ Enhance --dry-run output (shows full JSON structure)
6. ✅ Add JSON output to all commands
7. ✅ Improve validation error messages with examples

### Phase 2: Future Enhancements

3. Add basic markdown structure parsing

### Phase 3: Advanced Features

1. Template generation
2. Structure extraction
3. Advanced markdown parsing

## Breaking Changes Log

### Alpha → Beta

- **Schema Field Rename**: `cells` → `sectionReferences` in user-facing interfaces (keeping internal type names)
- **Coordinate Format**: Considering `[row, col]` → `{row: 0, col: 0}` for clarity

## Testing Considerations

- All new features need unit tests
- Integration tests for non-interactive mode
- Schema validation tests with new naming
- Backwards compatibility layer for migration period

## Success Metrics

- AI assistants can create views without human intervention
- Error rate reduced by 80% due to better examples
- Time to create first view reduced from 10+ minutes to <2 minutes
