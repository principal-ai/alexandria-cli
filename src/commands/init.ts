/**
 * Init command - Initialize Alexandria configuration and global registry
 */

import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { CONFIG_FILENAME, ProjectRegistryStore, MemoryPalace } from '@principal-ai/alexandria-core-library';
import { NodeFileSystemAdapter } from '@principal-ai/alexandria-core-library/node';
import { getAlexandriaWorkflowTemplate } from '../templates/alexandria-workflow.js';
import { getGitRemoteUrl } from '../utils/git.js';
import { ALEXANDRIA_DIRS } from '@principal-ai/alexandria-core-library';
import { execSync } from 'node:child_process';
import { getAlexandriaHome } from '../utils/env.js';

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

export function createInitCommand(): Command {
  const command = new Command('init');

  command
    .description('Initialize Alexandria configuration for your project')
    .option('-f, --force', 'Overwrite existing configuration')
    .option('--no-register', 'Skip registering project in global registry')
    .option('--no-workflow', 'Skip GitHub workflow setup')
    .option('--no-agents', 'Skip adding Alexandria guidance to AGENTS.md')
    .option('--no-hooks', 'Skip setting up husky pre-commit hooks')
    .option('-y, --yes', 'Non-interactive mode, accept all defaults')
    .option('--non-interactive', 'Non-interactive mode, accept all defaults (alias for --yes)')
    .action(async (options) => {
      try {
        const repoPath = process.cwd();
        const configPath = path.join(repoPath, CONFIG_FILENAME);

        // Welcome message explaining what Alexandria does
        console.log('┌────────────────────────────────────────────────────────────┐');
        console.log('│  🏛️  Alexandria - Documentation Quality for AI Agents      │');
        console.log('└────────────────────────────────────────────────────────────┘\n');
        console.log(
          '  Alexandria helps you maintain high-quality documentation that\n' +
            '  AI assistants can effectively use to understand your codebase.\n',
        );
        console.log('  Key concepts:');
        console.log('  • CodebaseViews link documentation to source files');
        console.log('  • Lint rules define documentation GOALS (not just suggestions)');
        console.log('  • Location-bound files (README.md, etc.) stay where they are\n');

        // Check if config already exists
        if (fs.existsSync(configPath) && !options.force) {
          console.error(`❌ Configuration already exists at ${CONFIG_FILENAME}`);
          console.error('   Use --force to overwrite');
          process.exit(1);
        }

        // Step 1: Create config
        console.log('─── Step 1: Creating Configuration ───────────────────────────\n');
        console.log(
          '  The config file defines your documentation quality GOALS.\n' +
            '  When you run "alexandria lint", these goals are checked.\n' +
            '  Treat lint output as objectives to achieve, not optional warnings.\n',
        );

        // Create minimal config
        const config = {
          $schema: 'https://raw.githubusercontent.com/a24z-ai/alexandria-cli/main/schema/alexandriarc.json',
          version: '1.0.0',
          context: {
            useGitignore: true,
            patterns: {
              exclude: [`${ALEXANDRIA_DIRS.PRIMARY}/**`],
            },
          },
        };

        // Write config file
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');

        console.log(`  ✅ Created ${CONFIG_FILENAME}`);
        console.log(`     Using .gitignore patterns + ${ALEXANDRIA_DIRS.PRIMARY}/ exclusions\n`);

        // Step 2: Global registry
        console.log('─── Step 2: Project Registry ─────────────────────────────────\n');
        console.log(
          '  The global registry tracks all your Alexandria-enabled projects,\n' +
            '  allowing cross-project documentation discovery.\n',
        );

        if (options.register !== false) {
          const fsAdapter = new NodeFileSystemAdapter();
          const homeDir = getAlexandriaHome();

          if (!homeDir) {
            console.warn('  ⚠️  Could not determine home directory for global registry');
          } else {
            try {
              // Validate it's a git repository
              const validatedPath = MemoryPalace.validateRepositoryPath(fsAdapter, repoPath);

              // Get project name (use directory name)
              const projectName = path.basename(validatedPath);

              // Get git remote URL
              const remoteUrl = getGitRemoteUrl(validatedPath);

              // Create registry store and register the project
              const registry = new ProjectRegistryStore(fsAdapter, homeDir);

              // Check if already registered
              const existing = registry.getProject(projectName);
              if (!existing) {
                registry.registerProject(projectName, validatedPath, remoteUrl);
                console.log(`  ✅ Registered project '${projectName}' in global registry`);
                if (remoteUrl) {
                  console.log(`     Remote: ${remoteUrl}`);
                }
              } else {
                console.log(`  ℹ️  Project '${projectName}' already registered`);
              }
            } catch (error) {
              // If not a git repo, just skip registration
              if (error instanceof Error && error.message.includes('git')) {
                console.log('  ℹ️  Skipping global registry (not a git repository)');
              } else {
                console.warn(
                  `  ⚠️  Could not register in global registry: ${error instanceof Error ? error.message : error}`,
                );
              }
            }
          }
        } else {
          console.log('  ⏭️  Skipped (--no-register)\n');
        }

        // Step 3: AGENTS.md
        console.log('\n─── Step 3: AI Agent Guidance (AGENTS.md) ────────────────────\n');
        console.log(
          '  AGENTS.md teaches AI assistants how to use Alexandria commands.\n' +
            '  This is a location-bound file and will stay at the repository root.\n',
        );

        const nonInteractive = options.yes || options.nonInteractive;
        if (options.agents !== false) {
          const installAgents = nonInteractive
            ? true
            : await promptYesNo('  Would you like to add Alexandria guidance to AGENTS.md?', true);

          if (installAgents) {
            try {
              // Use the agents command functionality
              const agentsPath = path.join(repoPath, 'AGENTS.md');

              // Check if AGENTS.md exists and has Alexandria section
              let hasAgentsFile = fs.existsSync(agentsPath);
              let hasAlexandriaSection = false;

              if (hasAgentsFile) {
                const content = fs.readFileSync(agentsPath, 'utf8');
                hasAlexandriaSection = content.includes('## Alexandria');
              }

              if (!hasAgentsFile) {
                // Create AGENTS.md with Alexandria guidance
                execSync('npx alexandria agents --add', {
                  cwd: repoPath,
                  stdio: 'pipe',
                });
                console.log('  ✅ Created AGENTS.md with Alexandria guidance');
              } else if (!hasAlexandriaSection) {
                // Add Alexandria section to existing AGENTS.md
                execSync('npx alexandria agents --add', {
                  cwd: repoPath,
                  stdio: 'pipe',
                });
                console.log('  ✅ Added Alexandria guidance to AGENTS.md');
              } else {
                console.log('  ℹ️  AGENTS.md already contains Alexandria guidance');
              }
            } catch (error) {
              console.warn(
                `  ⚠️  Could not add Alexandria guidance to AGENTS.md: ${error instanceof Error ? error.message : error}`,
              );
            }
          }
        } else {
          console.log('  ⏭️  Skipped (--no-agents)\n');
        }

        // Step 4: Pre-commit hooks
        console.log('\n─── Step 4: Pre-commit Validation (Optional) ──────────────────\n');
        console.log(
          '  Pre-commit hooks validate CodebaseViews before each commit,\n' +
            '  ensuring documentation stays in sync with code changes.\n',
        );

        if (options.hooks !== false && fs.existsSync(path.join(repoPath, '.git'))) {
          const installHooks = nonInteractive
            ? true
            : await promptYesNo('  Would you like to set up pre-commit validation?', true);

          if (installHooks) {
            try {
              // Check if husky is installed
              const huskyPath = path.join(repoPath, '.husky');
              const hasHusky = fs.existsSync(huskyPath);

              if (!hasHusky) {
                // Initialize husky
                console.log('  📦 Installing husky...');
                execSync('npm install --save-dev husky', {
                  cwd: repoPath,
                  stdio: 'inherit',
                });
                execSync('npx husky init', {
                  cwd: repoPath,
                  stdio: 'inherit',
                });
              }

              // Add Alexandria hooks
              execSync('npx alexandria hooks --add', {
                cwd: repoPath,
                stdio: 'pipe',
              });
              console.log('  ✅ Added Alexandria validation to pre-commit hooks');
            } catch (error) {
              console.warn(`  ⚠️  Could not set up husky hooks: ${error instanceof Error ? error.message : error}`);
            }
          }
        } else if (options.hooks === false) {
          console.log('  ⏭️  Skipped (--no-hooks)\n');
        } else {
          console.log('  ⏭️  Skipped (not a git repository)\n');
        }

        // Step 5: GitHub workflow
        console.log('\n─── Step 5: GitHub Actions (Optional) ────────────────────────\n');
        console.log(
          '  A GitHub workflow can auto-register your project and validate\n' + '  documentation on every push.\n',
        );

        if (options.workflow !== false && fs.existsSync(path.join(repoPath, '.git'))) {
          const installWorkflow = nonInteractive
            ? true
            : await promptYesNo('  Would you like to install the GitHub Action workflow?', true);

          if (installWorkflow) {
            // Get the workflow template
            const workflowTemplate = getAlexandriaWorkflowTemplate();

            // Create .github/workflows directory if it doesn't exist
            const workflowsDir = path.join(repoPath, '.github', 'workflows');
            if (!fs.existsSync(workflowsDir)) {
              fs.mkdirSync(workflowsDir, { recursive: true });
            }

            // Write the workflow file
            const workflowPath = path.join(workflowsDir, 'alexandria.yml');

            if (fs.existsSync(workflowPath)) {
              const overwrite = nonInteractive
                ? false
                : await promptYesNo('     Workflow already exists. Overwrite?', false);
              if (!overwrite) {
                console.log('     Skipped workflow installation');
              } else {
                fs.writeFileSync(workflowPath, workflowTemplate, 'utf8');
                console.log(`  ✅ Updated GitHub workflow at .github/workflows/alexandria.yml`);
              }
            } else {
              fs.writeFileSync(workflowPath, workflowTemplate, 'utf8');
              console.log(`  ✅ Created GitHub workflow at .github/workflows/alexandria.yml`);
            }
          }
        } else if (options.workflow === false) {
          console.log('  ⏭️  Skipped (--no-workflow)\n');
        } else {
          console.log('  ⏭️  Skipped (not a git repository)\n');
        }

        // Final summary
        console.log('\n┌────────────────────────────────────────────────────────────┐');
        console.log('│  ✨ Alexandria initialized successfully!                    │');
        console.log('└────────────────────────────────────────────────────────────┘\n');

        console.log('  📋 Next steps:\n');
        console.log('     1. Run "alexandria lint" to see your documentation GOALS');
        console.log('        (Remember: these are objectives to achieve, not just warnings)\n');
        console.log('     2. Add documentation to your library:');
        console.log('        alexandria add-doc <path-to-markdown-file>\n');
        console.log('     3. View your library:');
        console.log('        alexandria list\n');

        const hasWorkflow = fs.existsSync(path.join(repoPath, '.github', 'workflows', 'alexandria.yml'));
        const hasHooks =
          fs.existsSync(path.join(repoPath, '.husky', 'pre-commit')) &&
          fs.readFileSync(path.join(repoPath, '.husky', 'pre-commit'), 'utf8').includes('alexandria');

        if (hasWorkflow || hasHooks) {
          console.log('     4. Commit your changes to activate:');
          if (hasWorkflow) {
            console.log('        • GitHub workflow for CI validation');
          }
          if (hasHooks) {
            console.log('        • Pre-commit hooks for local validation');
          }
          console.log('');
        }

        console.log('  💡 Tip: README.md and other location-bound files will NOT be');
        console.log('     suggested for relocation - they stay where they belong.\n');
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}
