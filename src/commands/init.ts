/**
 * Init command - Initialize Alexandria configuration
 */

import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CONFIG_FILENAME, ALEXANDRIA_DIRS } from '@principal-ai/alexandria-core-library';
import { getAlexandriaWorkflowTemplate } from '../templates/alexandria-workflow.js';
import { execSync } from 'node:child_process';

export function createInitCommand(): Command {
  const command = new Command('init');

  command
    .description('Initialize Alexandria configuration for your project')
    .option('-f, --force', 'Overwrite existing configuration')
    .option('--no-workflow', 'Skip GitHub workflow setup')
    .option('--no-agents', 'Skip adding Alexandria guidance to AGENTS.md')
    .option('--no-hooks', 'Skip setting up husky pre-commit hooks')
    .action(async (options) => {
      try {
        const repoPath = process.cwd();
        const configPath = path.join(repoPath, CONFIG_FILENAME);

        // Track what was installed for undo instructions
        const installed: { agents?: boolean; hooks?: boolean; workflow?: boolean } = {};

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

        // Step 2: AGENTS.md
        console.log('─── Step 2: AI Agent Guidance (AGENTS.md) ────────────────────\n');
        console.log(
          '  AGENTS.md teaches AI assistants how to use Alexandria commands.\n' +
            '  This is a location-bound file and will stay at the repository root.\n',
        );

        if (options.agents !== false) {
          try {
            const agentsPath = path.join(repoPath, 'AGENTS.md');
            let hasAgentsFile = fs.existsSync(agentsPath);
            let hasAlexandriaSection = false;

            if (hasAgentsFile) {
              const content = fs.readFileSync(agentsPath, 'utf8');
              hasAlexandriaSection = content.includes('## Alexandria');
            }

            if (!hasAgentsFile) {
              execSync('npx alexandria agents --add', {
                cwd: repoPath,
                stdio: 'pipe',
              });
              console.log('  ✅ Created AGENTS.md with Alexandria guidance');
              installed.agents = true;
            } else if (!hasAlexandriaSection) {
              execSync('npx alexandria agents --add', {
                cwd: repoPath,
                stdio: 'pipe',
              });
              console.log('  ✅ Added Alexandria guidance to AGENTS.md');
              installed.agents = true;
            } else {
              console.log('  ℹ️  AGENTS.md already contains Alexandria guidance');
            }
          } catch (error) {
            console.warn(
              `  ⚠️  Could not add Alexandria guidance to AGENTS.md: ${error instanceof Error ? error.message : error}`,
            );
          }
        } else {
          console.log('  ⏭️  Skipped (--no-agents)\n');
        }

        // Step 3: Pre-commit hooks
        console.log('\n─── Step 3: Pre-commit Validation ────────────────────────────\n');
        console.log(
          '  Pre-commit hooks validate CodebaseViews before each commit,\n' +
            '  ensuring documentation stays in sync with code changes.\n',
        );

        if (options.hooks !== false && fs.existsSync(path.join(repoPath, '.git'))) {
          try {
            const huskyPath = path.join(repoPath, '.husky');
            const hasHusky = fs.existsSync(huskyPath);

            if (!hasHusky) {
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

            execSync('npx alexandria hooks --add', {
              cwd: repoPath,
              stdio: 'pipe',
            });
            console.log('  ✅ Added Alexandria validation to pre-commit hooks');
            installed.hooks = true;
          } catch (error) {
            console.warn(`  ⚠️  Could not set up husky hooks: ${error instanceof Error ? error.message : error}`);
          }
        } else if (options.hooks === false) {
          console.log('  ⏭️  Skipped (--no-hooks)\n');
        } else {
          console.log('  ⏭️  Skipped (not a git repository)\n');
        }

        // Step 4: GitHub workflow
        console.log('\n─── Step 4: GitHub Actions ────────────────────────────────────\n');
        console.log(
          '  A GitHub workflow can auto-register your project and validate\n' + '  documentation on every push.\n',
        );

        if (options.workflow !== false && fs.existsSync(path.join(repoPath, '.git'))) {
          const workflowTemplate = getAlexandriaWorkflowTemplate();
          const workflowsDir = path.join(repoPath, '.github', 'workflows');
          const workflowPath = path.join(workflowsDir, 'alexandria.yml');

          if (fs.existsSync(workflowPath)) {
            console.log('  ℹ️  Workflow already exists at .github/workflows/alexandria.yml');
            console.log('     Use "alexandria install-workflow --force" to update it');
          } else {
            if (!fs.existsSync(workflowsDir)) {
              fs.mkdirSync(workflowsDir, { recursive: true });
            }
            fs.writeFileSync(workflowPath, workflowTemplate, 'utf8');
            console.log(`  ✅ Created GitHub workflow at .github/workflows/alexandria.yml`);
            installed.workflow = true;
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

        // Undo instructions if anything was installed
        if (installed.agents || installed.hooks || installed.workflow) {
          console.log('  🔧 To undo any of these changes:\n');
          if (installed.agents) {
            console.log('     • AGENTS.md: alexandria agents --remove');
          }
          if (installed.hooks) {
            console.log('     • Pre-commit hooks: alexandria hooks --remove');
          }
          if (installed.workflow) {
            console.log('     • GitHub workflow: rm .github/workflows/alexandria.yml');
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
