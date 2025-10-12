# CodebaseView Stamp Feature Design

## Background

Users have been manually updating the `timestamp` field in CodebaseView JSON files to pass staleness checks from the `stale-references` lint rule. This informal process needs to be formalized with proper tooling.

## Problem Statement

- Users manually edit CodebaseView JSON files to update timestamps
- This breaks the abstraction contract between CLI and core-library
- No formalized way to "stamp" a document as reviewed/fresh
- The `stale-references` rule uses `timestamp` field to detect stale documents (default: 30 days)

## Proposed Solution

### Part 1: Core Library Enhancement

Add a `stampView` method to `CodebaseViewsStore` that updates the timestamp field through the proper abstraction.

**Method signature:**

```typescript
/**
 * Update the timestamp on a CodebaseView to mark it as fresh.
 * This is used to indicate that a view has been reviewed and is current.
 *
 * @param repositoryRootPath - Validated repository path
 * @param viewId - ID of the view to stamp
 * @param timestamp - Optional ISO timestamp (defaults to current time)
 * @returns true if the view was stamped, false if view not found
 */
stampView(
  repositoryRootPath: ValidatedRepositoryPath,
  viewId: string,
  timestamp?: string
): boolean;
```

**Implementation approach:**

```typescript
stampView(repositoryRootPath: ValidatedRepositoryPath, viewId: string, timestamp?: string): boolean {
  const view = this.getView(repositoryRootPath, viewId);
  if (!view) {
    return false;
  }

  return this.updateView(repositoryRootPath, viewId, {
    timestamp: timestamp ?? new Date().toISOString()
  });
}
```

**Alternative: Enhance `updateView` to auto-update timestamp**

Consider adding an option to `updateView` to automatically update the timestamp on any update:

```typescript
updateView(
  repositoryRootPath: ValidatedRepositoryPath,
  viewId: string,
  updates: Partial<CodebaseView>,
  options?: { updateTimestamp?: boolean } // default: true
): boolean;
```

This would ensure timestamps stay current whenever views are modified.

### Part 2: CLI Command

Add an `alexandria stamp` command that uses the new `stampView` method.

**Command Interface:**

```bash
# Show all views with their staleness status
alexandria stamp

# Stamp a specific view
alexandria stamp <view-id>

# Stamp all views in repository
alexandria stamp --all

# Preview without making changes
alexandria stamp --dry-run

# Verbose output
alexandria stamp --verbose
```

**Features:**

- Interactive list showing all views with their "last updated" status when called without arguments
- Color-coded staleness indicators (green=fresh, yellow=aging, red=stale based on maxAgeDays)
- Dry-run mode for preview
- Batch stamping with `--all` flag
- Proper error handling through core-library abstraction

## Technical Requirements

### Core Library (`@a24z/core-library`)

1. Add `stampView` method to `CodebaseViewsStore` class
2. Export the method in the public API
3. Add tests for the new method
4. Update TypeScript definitions

### CLI (`alexandria-cli`)

1. Create `src/commands/stamp.ts` command file
2. Use `CodebaseViewsStore.stampView()` method (not direct JSON manipulation)
3. Use `CodebaseViewsStore.listViews()` for displaying view list
4. Integrate with existing filesystem adapters (`NodeFileSystemAdapter`)
5. Add command to main CLI registry in `src/index.ts`

## Benefits

1. **Formalized Process**: Replaces ad-hoc JSON editing with proper tooling
2. **Maintains Abstraction**: Uses core-library APIs instead of direct file access
3. **Better UX**: Interactive command with visual feedback
4. **Audit Trail**: Consistent timestamp updates through proper channels
5. **Batch Operations**: Can stamp multiple views efficiently

## Implementation Dependencies

- Core library must implement `stampView` first
- CLI command depends on core library version with `stampView` support
- Minimum core-library version: TBD (next release after implementation)

## Open Questions

1. Should we track _who_ stamped a view? (user metadata)
2. Should we support stamping with a custom message/reason?
3. Should the CLI auto-stamp when views are created/modified?
4. Should we add a `lastReviewedBy` field separate from `timestamp`?

## Migration Notes

- Existing CodebaseViews with timestamps will continue to work
- Views without timestamps will be flagged by `stale-references` rule
- No breaking changes to existing CodebaseView schema
