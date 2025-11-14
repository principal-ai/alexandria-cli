/**
 * Formatting utilities for CLI output
 */

import type {
  CodebaseValidationResult as ValidationResult,
  ValidationIssue,
} from '@principal-ai/alexandria-core-library';

/**
 * Format a validation result for terminal display
 */
export function formatValidationResult(result: ValidationResult): string {
  if (result.issues.length === 0) {
    return '✅ No validation issues found';
  }

  const lines: string[] = [];

  // Group issues by severity
  const errorIssues = result.issues.filter((i) => i.severity === 'error');
  const warningIssues = result.issues.filter((i) => i.severity === 'warning');
  const infoIssues = result.issues.filter((i) => i.severity === 'info');

  // Display errors first
  if (errorIssues.length > 0) {
    lines.push('❌ Critical Issues:');
    errorIssues.forEach((issue) => {
      lines.push(formatIssue(issue, '  '));
    });

    if (!result.isValid) {
      lines.push('');
      lines.push('⚠️  This view may not render properly until these issues are fixed.');
    }
  }

  // Display warnings
  if (warningIssues.length > 0) {
    if (errorIssues.length > 0) lines.push('');
    lines.push('⚠️  Validation Warnings:');
    warningIssues.forEach((issue) => {
      lines.push(formatIssue(issue, '  '));
    });
  }

  // Display info messages
  if (infoIssues.length > 0) {
    if (errorIssues.length > 0 || warningIssues.length > 0) lines.push('');
    lines.push('ℹ️  Information:');
    infoIssues.forEach((issue) => {
      lines.push(formatIssue(issue, '  '));
    });
  }

  return lines.join('\n');
}

/**
 * Format a single validation issue
 */
function formatIssue(issue: ValidationIssue, indent: string = ''): string {
  const lines: string[] = [];

  // Main message with location
  if (issue.location) {
    lines.push(`${indent}• ${issue.message} (${issue.location})`);
  } else {
    lines.push(`${indent}• ${issue.message}`);
  }

  // Add context if provided
  if (issue.context) {
    lines.push(`${indent}  ${issue.context}`);
  }

  // Add helpful examples for common errors
  const example = getExampleForIssue(issue);
  if (example) {
    lines.push(`${indent}  Example: ${example}`);
  }

  return lines.join('\n');
}

/**
 * Get helpful example for common validation issues
 */
function getExampleForIssue(issue: ValidationIssue): string | null {
  const message = issue.message.toLowerCase();

  if (message.includes('invalid referencegroups format') || message.includes('invalid cells format')) {
    return `{"Section Name": {"coordinates": [0, 0], "files": ["src/file.ts"]}}`;
  }

  if (message.includes('missing required field')) {
    if (message.includes('coordinates')) {
      return `"coordinates": [0, 0] (row, column - zero indexed)`;
    }
    if (message.includes('files')) {
      return `"files": ["src/index.ts", "src/utils.ts"]`;
    }
    if (message.includes('name')) {
      return `"name": "Architecture Overview"`;
    }
    if (message.includes('description')) {
      return `"description": "High-level system architecture"`;
    }
  }

  if (message.includes('file not found') || message.includes('file does not exist')) {
    return 'Ensure file paths are relative to repository root (e.g., "src/index.ts" not "/src/index.ts")';
  }

  if (message.includes('invalid coordinates')) {
    return '[row, col] where both are zero-indexed integers (e.g., [0, 0] for top-left)';
  }

  if (message.includes('duplicate coordinates')) {
    return 'Each reference group must have unique coordinates. Consider using [0,1] or [1,0]';
  }

  if (message.includes('invalid file path')) {
    return 'Use forward slashes and relative paths: "src/components/Button.tsx"';
  }

  return null;
}

/**
 * Format validation summary
 */
export function formatValidationSummary(result: ValidationResult): string {
  const { summary } = result;
  const parts: string[] = [];

  if (summary.errors > 0) {
    parts.push(`${summary.errors} error${summary.errors === 1 ? '' : 's'}`);
  }

  if (summary.warnings > 0) {
    parts.push(`${summary.warnings} warning${summary.warnings === 1 ? '' : 's'}`);
  }

  if (summary.info > 0) {
    parts.push(`${summary.info} info message${summary.info === 1 ? '' : 's'}`);
  }

  if (parts.length === 0) {
    return 'No issues found';
  }

  return parts.join(', ');
}
