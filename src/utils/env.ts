/**
 * Environment utilities for Alexandria CLI
 */

/**
 * Get the Alexandria home directory
 *
 * Checks ALEXANDRIA_HOME first, then falls back to HOME or USERPROFILE.
 * This allows tests and advanced users to override the default location.
 *
 * @returns The Alexandria home directory path, or undefined if none could be determined
 */
export function getAlexandriaHome(): string | undefined {
  return process.env.ALEXANDRIA_HOME || process.env.HOME || process.env.USERPROFILE;
}
