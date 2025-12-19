/**
 * Alexandria CLI - Main entry point
 *
 * This CLI provides direct access to codebase views functionality
 * using the MemoryPalace API.
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createListCommand } from './commands/list.js';
import { createSaveCommand } from './commands/save.js';
import { createValidateCommand } from './commands/validate.js';
import { createAddDocCommand } from './commands/add-doc.js';
import { createInstallWorkflowCommand } from './commands/install-workflow.js';
import { createListUntrackedDocsCommand } from './commands/list-untracked-docs.js';
import { createAddAllDocsCommand } from './commands/add-all-docs.js';
import { createValidateAllCommand } from './commands/validate-all.js';
import { createInitCommand } from './commands/init.js';
import { lintCommand } from './commands/lint.js';
import { createUpdateCommand } from './commands/update.js';
import { createStatusCommand } from './commands/status.js';
import { createAgentsCommand } from './commands/agents.js';
import { createHooksCommand } from './commands/hooks.js';
import { createCoverageCommand } from './commands/coverage.js';
import { createOpenCommand } from './commands/open.js';
import { createFixOverviewPathsCommand } from './commands/fix-overview-paths.js';
import { createSchemaCommand } from './commands/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

const program = new Command();

program.name('alexandria').description('Alexandria CLI - Unified Context Management').version(packageJson.version);

// Add commands
program.addCommand(createInitCommand());
program.addCommand(createStatusCommand());
program.addCommand(createAgentsCommand());
program.addCommand(createHooksCommand());
program.addCommand(lintCommand);
program.addCommand(createListCommand());
program.addCommand(createSaveCommand());
program.addCommand(createValidateCommand());
program.addCommand(createValidateAllCommand());
program.addCommand(createAddDocCommand());
program.addCommand(createAddAllDocsCommand());
program.addCommand(createInstallWorkflowCommand());
program.addCommand(createListUntrackedDocsCommand());
program.addCommand(createUpdateCommand());
program.addCommand(createCoverageCommand());
program.addCommand(createOpenCommand());
program.addCommand(createFixOverviewPathsCommand());
program.addCommand(createSchemaCommand());

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
