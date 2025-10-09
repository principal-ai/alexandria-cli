# CodebaseView Data Model

This document provides a deep dive into CodebaseViews - the core data structure that powers Alexandria's context management system.

## What is a CodebaseView?

A CodebaseView is a structured representation that maps documentation to source code files. It's stored as JSON in `.alexandria/views/[view-id].json` and contains:

1. **Metadata**: Name, description, version, timestamps
2. **Grid Layout**: Organizational structure (rows × columns)
3. **Reference Groups**: Collections of related files with coordinates
4. **Overview Document**: Path to the markdown documentation
5. **UI Configuration**: Display preferences for visual rendering

## CodebaseView Structure

Here's the complete structure of a CodebaseView (defined in `@a24z/core-library`):

```json
{
  "id": "architecture-overview",
  "version": "1.0.0",
  "name": "Architecture Overview",
  "description": "System architecture and component relationships",
  "rows": 2,
  "cols": 3,
  "referenceGroups": {
    "Core Components": {
      "coordinates": [0, 0],
      "files": ["src/index.ts", "src/commands/init.ts"],
      "priority": 0
    },
    "Utilities": {
      "coordinates": [0, 1],
      "files": ["src/utils/repository.ts", "src/utils/validation.ts"],
      "priority": 0
    }
  },
  "overviewPath": "docs/architecture.md",
  "category": "documentation",
  "displayOrder": 0,
  "timestamp": "2025-10-09T19:00:00.000Z",
  "metadata": {
    "generationType": "user",
    "ui": {
      "enabled": true,
      "rows": 2,
      "cols": 3,
      "showCellLabels": true,
      "cellLabelPosition": "top"
    }
  }
}
```

### Field Descriptions

**id** (string)

- Unique identifier for the view
- Generated from name using `generateViewIdFromName()` in `@a24z/core-library`
- Example: "Architecture Overview" → "architecture-overview"

**version** (string)

- Semantic version for the view schema
- Currently "1.0.0" for all views
- Allows future schema evolution

**name** (string)

- Human-readable name displayed in listings
- Generated in `src/utils/viewCreation.ts` via `generateViewNameFromPath()`
- Example: "docs/architecture.md" → "Docs - Architecture"

**description** (string)

- Brief explanation of what the view covers
- Can be extracted from markdown or provided manually
- Used in `src/commands/list.ts` output

**rows** (number)

- Number of rows in the grid layout
- Calculated by `src/utils/documentParser.ts` based on sections
- Formula: `Math.floor(sectionIndex / 3)` for auto-layout

**cols** (number)

- Number of columns in the grid layout
- Typically 1-3 columns (3 is optimal for visual display)
- Formula: `Math.min(maxCol + 1, 3)` from `src/utils/documentParser.ts`

**referenceGroups** (Record<string, CodebaseViewFileCell>)

- The heart of the CodebaseView
- Maps section names to file collections
- Each group has coordinates, files array, and priority

**overviewPath** (string)

- Relative path to the markdown documentation
- Example: "README.md" or "docs/architecture.md"
- Validated by `src/utils/validation.ts` to ensure file exists

**category** (string)

- Categorization for organizing views
- Common values: "documentation", "product", "technical", "other"
- Used for filtering in `src/commands/list.ts` with `--category` option

**displayOrder** (number)

- Ordering hint for UI display
- Auto-assigned when view is saved
- Lower numbers appear first

**timestamp** (string)

- ISO 8601 timestamp of view creation/modification
- Used by lint rules to detect stale content
- Generated with `new Date().toISOString()`

**metadata** (object)

- Additional metadata for tooling
- `generationType`: "user" or "auto"
- `ui`: Display configuration for visual renderers

## Reference Groups Deep Dive

Reference groups are the mapping between documentation sections and source files. They're created by `src/utils/documentParser.ts` when parsing markdown.

### CodebaseViewFileCell Structure

```typescript
{
  coordinates: [row, col],  // Grid position
  files: string[],          // Array of file paths
  priority: number          // Display priority (0 = normal)
}
```

### How Reference Groups are Created

The `extractStructureFromMarkdown()` function in `src/utils/documentParser.ts`:

1. **Parse Headings**: `## Section Name` becomes a reference group key
2. **Scan for Files**: Look for file references in that section
3. **Validate Existence**: Check if files exist in repository (when repositoryPath provided)
4. **Assign Coordinates**: Place in grid (left-to-right, top-to-bottom)
5. **Build Group**: Create CodebaseViewFileCell with files array

Example markdown:

```markdown
## Authentication System

The auth logic is in `src/auth/provider.ts` and session handling
is in `src/auth/session.ts`.

## Database Layer

Models are defined in `src/models/user.ts` and `src/models/session.ts`.
```

Becomes:

```json
{
  "Authentication System": {
    "coordinates": [0, 0],
    "files": ["src/auth/provider.ts", "src/auth/session.ts"],
    "priority": 0
  },
  "Database Layer": {
    "coordinates": [0, 1],
    "files": ["src/models/user.ts", "src/models/session.ts"],
    "priority": 0
  }
}
```

### File Path Extraction Patterns

The `src/utils/documentParser.ts` recognizes these markdown patterns:

1. **Backtick code**: `` `src/index.ts` ``
2. **Bold text**: `**src/utils/helper.js**`
3. **Markdown links**: `[Link](path/to/file.ts)`
4. **Plain paths**: `src/components/Button.tsx` (with whitespace boundaries)

Supported extensions:

- TypeScript: `.ts`, `.tsx`
- JavaScript: `.js`, `.jsx`, `.mjs`, `.cjs`
- Config: `.json`, `.yaml`, `.yml`
- Docs: `.md`, `.txt`
- Styles: `.css`, `.scss`
- Markup: `.html`

Paths must be relative to repository root.

## View Creation Process

The `src/utils/viewCreation.ts` orchestrates view creation:

### 1. Find Untracked Documents

`findUntrackedDocuments()` scans for markdown files:

- Respect `.gitignore` patterns (using `ignore` package)
- Exclude `.alexandria/` directory
- Filter out files already in views
- Return `UntrackedDocumentInfo` with paths

### 2. Generate View Metadata

`generateViewNameFromPath()` converts file paths to readable names:

- `README.md` → "Readme"
- `docs/architecture.md` → "Docs - Architecture"
- Capitalize words, replace hyphens/underscores with spaces

### 3. Parse Document Structure

`extractStructureFromMarkdown()` from `src/utils/documentParser.ts`:

- Extract title (first `# Heading`)
- Extract description (first paragraph)
- Find all sections (`## Headings`)
- Scan for file references in each section
- Validate files exist
- Calculate grid dimensions

### 4. Create View Object

`createViewFromDocument()` builds the CodebaseView:

- Generate unique ID from name
- Set version to "1.0.0"
- Apply provided or extracted metadata
- Add UI configuration
- Set timestamp

### 5. Validate and Save

Either:

- `palace.saveView()` - Save without validation (if `skipValidation: true`)
- `palace.saveViewWithValidation()` - Validate then save (default)

Validation from `@a24z/core-library` checks:

- All referenced files exist
- Overview document exists
- Grid coordinates are valid
- No duplicate coordinates

## Validation Rules

The `src/utils/validation.ts` provides repository-wide validation:

### validateAllViews()

Iterates through all views in `.alexandria/views/`:

- Calls `palace.validateView()` for each
- Collects validation results
- Calculates summary statistics
- Returns `ValidationSummary` with counts and issues

### View-Level Validation

Each view is validated for:

**File References**

- All files in `referenceGroups` must exist
- Paths must be relative to repository root
- No absolute paths or URLs

**Overview Document**

- The `overviewPath` must point to existing markdown file
- File must be readable
- Path must be within repository

**Grid Coordinates**

- Coordinates must be within declared rows×cols bounds
- No duplicate coordinates
- Coordinates must be valid [row, col] tuples

**Structure**

- Required fields present (id, version, name, etc.)
- Types match schema
- No null/undefined in critical fields

## Lint Quality Rules

Beyond basic validation, `src/commands/lint.ts` applies quality rules:

### require-references

**Rule**: Every markdown file must be used as overview in at least one CodebaseView

**Impact**: Without this, documentation exists but has no structured context

**Check**: Scan repository for `.md` files, verify each appears as `overviewPath`

### orphaned-references

**Rule**: CodebaseViews must not reference non-existent files

**Impact**: AI agents will try to read files that don't exist

**Check**: For each file in `referenceGroups`, verify it exists

### stale-references

**Rule**: Documentation shouldn't be outdated compared to source files

**Impact**: AI agents may use old patterns and assumptions

**Check**: Compare view timestamp to file modification times

**Configuration** (in `.alexandriarc.json`):

```json
{
  "id": "stale-references",
  "severity": "warning",
  "options": {
    "maxAgeDays": 30
  }
}
```

### document-organization

**Rule**: Documentation files should be in designated folders

**Impact**: Disorganized docs are harder to find

**Check**: Ensure files are in `docs/`, `documentation/`, or allowed root exceptions

### filename-convention

**Rule**: Documentation filenames should follow consistent convention

**Impact**: Inconsistent naming reduces maintainability

**Options**: `kebab-case`, `camelCase`, `snake_case`

**Configuration**:

```json
{
  "id": "filename-convention",
  "options": {
    "style": "kebab-case",
    "exceptions": ["README.md", "CHANGELOG.md"]
  }
}
```

## Schema Definition

The JSON schema is defined in `schema/alexandriarc.json` and describes:

1. **CodebaseView schema**: Complete structure definition
2. **Configuration schema**: `.alexandriarc.json` format
3. **Lint rules schema**: Rule configuration options

View the schema with: `alexandria schema --type codebase-view`

## Working with Views Programmatically

### Listing Views

```typescript
// From src/commands/list.ts
const palace = new MemoryPalace(repoPath, fileSystemAdapter);
const views = palace.listViews();
```

### Saving Views

```typescript
// From src/commands/save.ts
const view: CodebaseView = {
  /* ... */
};
palace.saveView(view);
```

### Validating Views

```typescript
// From src/commands/validate.ts
const result = palace.validateView(view);
if (!result.isValid) {
  // Handle validation issues
}
```

### Modifying Views

Views are JSON files, so they can be edited directly:

1. Edit `.alexandria/views/[view-id].json`
2. Run `alexandria validate [view-id]` to check
3. Fix any issues reported

## Coverage Impact

CodebaseViews directly impact coverage metrics calculated by `src/utils/coverage.ts`:

**Files with context** = Union of all files in all `referenceGroups` across all views

**Coverage %** = (Files with context / Total source files) × 100

Higher coverage means:

- More files have AI-accessible context
- Better documentation coverage
- Easier onboarding and AI assistance

Check with: `alexandria coverage --verbose --by-extension`

## Best Practices

1. **Group Related Files**: Put files that work together in the same reference group
2. **Use Descriptive Names**: Reference group keys should clearly indicate purpose
3. **Keep Grids Reasonable**: 2-3 columns, 2-4 rows is optimal for readability
4. **Validate Early**: Run validation after creating/editing views
5. **Monitor Staleness**: Update views when referenced files change significantly
6. **Document Relationships**: Explain in markdown HOW files relate, not just that they exist

The document parsing in `src/utils/documentParser.ts` is designed to make this easy - just write good markdown with file references, and the structure is extracted automatically.
