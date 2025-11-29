#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
// @ts-ignore
import degit from 'degit';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ProjectOptions {
	projectName: string;
	framework: 'react' | 'vue' | 'wordpress';
	includeBackend: boolean;
	packageManager: 'npm' | 'yarn' | 'pnpm';
	apiKey?: string;
	stripeKey?: string;
	squareAppId?: string;
	squareLocationId?: string;
}

const program = new Command();

program
	.name('meshalto')
	.description('CLI tool to set up Meshalto Payment SDK projects')
	.version('0.1.0');

program
	.command('create [project-name]')
	.description('Create a new Meshalto payment integration project')
	.action(async (projectName?: string) => {
		console.log(
			chalk.blue.bold('\n🚀 Welcome to Meshalto Payment SDK Setup!\n')
		);

		const answers = await inquirer.prompt<ProjectOptions>([
			{
				type: 'input',
				name: 'projectName',
				message: 'Project name:',
				default: projectName || 'my-meshalto-app',
				validate: (input: string) => {
					if (!input) return 'Project name is required';
					if (!/^[a-z0-9-]+$/.test(input))
						return 'Project name can only contain lowercase letters, numbers, and hyphens';
					return true;
				},
			},
			{
				type: 'list',
				name: 'framework',
				message: 'Which framework do you want to use?',
				choices: [
					{ name: 'React (Vite + TypeScript)', value: 'react' },
					{ name: 'Vue.js', value: 'vue' },
					{ name: 'WordPress Plugin', value: 'wordpress' },
				],
				default: 'react',
			},
			{
				type: 'confirm',
				name: 'includeBackend',
				message: 'Do you want to include the backend API server?',
				default: true,
			},
			{
				type: 'list',
				name: 'packageManager',
				message: 'Which package manager do you want to use?',
				choices: ['npm', 'yarn', 'pnpm'],
				default: 'npm',
			},
		]);

		const {
			projectName: finalProjectName,
			framework,
			includeBackend,
			packageManager,
		} = answers;
		const projectPath = path.join(process.cwd(), finalProjectName);

		// Check if directory already exists
		if (await fs.pathExists(projectPath)) {
			console.log(
				chalk.red(`\n❌ Directory "${finalProjectName}" already exists!\n`)
			);
			process.exit(1);
		}

		const spinner = ora('Creating project structure...').start();

		try {
			// Create project directory
			await fs.ensureDir(projectPath);

			// Clone the repository using degit
			spinner.text = 'Downloading Meshalto SDK...';
			const emitter = degit('johnakhilomen/meshalto-sdk', {
				cache: false,
				force: true,
			});

			await emitter.clone(projectPath);

			// Clean up unnecessary files
			await fs.remove(path.join(projectPath, '.git'));
			await fs.remove(path.join(projectPath, 'packages'));

			// Set up based on framework choice
			if (framework === 'react') {
				spinner.text = 'Setting up React project...';
				const reactPath = path.join(projectPath, 'sdk/vite-react');

				// Copy .env.example to .env
				await fs.copy(
					path.join(reactPath, '.env.example'),
					path.join(reactPath, '.env')
				);

				// Install dependencies
				spinner.text = `Installing React dependencies with ${packageManager}...`;
				await execAsync(`cd ${reactPath} && ${packageManager} install`);
			} else if (framework === 'vue') {
				spinner.text = 'Setting up Vue project...';
				const vuePath = path.join(projectPath, 'sdk/vue');

				if (await fs.pathExists(path.join(vuePath, 'package.json'))) {
					spinner.text = `Installing Vue dependencies with ${packageManager}...`;
					await execAsync(`cd ${vuePath} && ${packageManager} install`);
				}
			} else if (framework === 'wordpress') {
				spinner.text = 'Setting up WordPress plugin...';
				// WordPress doesn't need npm install
			}

			// Set up backend if requested
			if (includeBackend) {
				spinner.text = 'Setting up backend server...';
				const serverPath = path.join(projectPath, 'sdk/server');

				// Copy .env.example to .env
				await fs.copy(
					path.join(serverPath, '.env.example'),
					path.join(serverPath, '.env')
				);

				// Generate a random API key
				const apiKey = generateRandomKey(32);
				const envPath = path.join(serverPath, '.env');
				let envContent = await fs.readFile(envPath, 'utf-8');
				envContent = envContent.replace(
					'API_KEY=your_random_32_char_key_here',
					`API_KEY=${apiKey}`
				);
				await fs.writeFile(envPath, envContent);

				// Update frontend .env with the same API key
				if (framework === 'react') {
					const frontendEnvPath = path.join(projectPath, 'sdk/vite-react/.env');
					let frontendEnv = await fs.readFile(frontendEnvPath, 'utf-8');
					frontendEnv = frontendEnv.replace(
						'VITE_MESHALTO_API_KEY=XXX',
						`VITE_MESHALTO_API_KEY=${apiKey}`
					);
					await fs.writeFile(frontendEnvPath, frontendEnv);
				}
			}

			// Remove unused framework directories
			if (framework !== 'react') {
				await fs.remove(path.join(projectPath, 'sdk/vite-react'));
			}
			if (framework !== 'vue') {
				await fs.remove(path.join(projectPath, 'sdk/vue'));
			}
			if (framework !== 'wordpress') {
				await fs.remove(path.join(projectPath, 'sdk/wordpress-plugin'));
			}
			if (!includeBackend) {
				await fs.remove(path.join(projectPath, 'sdk/server'));
			}

			spinner.succeed(chalk.green('Project created successfully!'));

			// Print next steps
			console.log(chalk.blue.bold('\n📋 Next Steps:\n'));
			console.log(chalk.white(`  cd ${finalProjectName}`));

			if (includeBackend) {
				console.log(
					chalk.white('\n  🔧 Configure your API keys in the .env files:')
				);
				console.log(
					chalk.gray(`     - sdk/server/.env (Stripe, Square, PayPal keys)`)
				);
				if (framework === 'react' || framework === 'vue') {
					console.log(
						chalk.gray(
							`     - sdk/${
								framework === 'react' ? 'vite-react' : 'vue'
							}/.env (Frontend keys)`
						)
					);
				}

				console.log(chalk.white('\n  🐳 Start the backend server:'));
				console.log(chalk.gray('     cd sdk/server'));
				console.log(chalk.gray('     docker-compose up -d'));
			}

			if (framework === 'react') {
				console.log(chalk.white('\n  🚀 Start the React development server:'));
				console.log(chalk.gray('     cd sdk/vite-react'));
				console.log(chalk.gray(`     ${packageManager} run dev`));
			} else if (framework === 'vue') {
				console.log(chalk.white('\n  🚀 Start the Vue development server:'));
				console.log(chalk.gray('     cd sdk/vue'));
				console.log(chalk.gray(`     ${packageManager} run dev`));
			} else if (framework === 'wordpress') {
				console.log(chalk.white('\n  🚀 Install the WordPress plugin:'));
				console.log(
					chalk.gray(
						'     1. Copy sdk/wordpress-plugin to your WordPress plugins directory'
					)
				);
				console.log(
					chalk.gray('     2. Activate the plugin in WordPress admin')
				);
			}

			console.log(
				chalk.blue(
					'\n📚 Documentation: https://github.com/johnakhilomen/meshalto-sdk'
				)
			);
			console.log(chalk.green('\n✨ Happy coding!\n'));
		} catch (error: any) {
			spinner.fail(chalk.red('Failed to create project'));
			console.error(chalk.red('\nError:'), error.message);

			// Clean up on error
			if (await fs.pathExists(projectPath)) {
				await fs.remove(projectPath);
			}
			process.exit(1);
		}
	});

program
	.command('init')
	.description('Initialize Meshalto in an existing project')
	.action(async () => {
		console.log(chalk.blue.bold('\n🔧 Initialize Meshalto Payment SDK\n'));

		const answers = await inquirer.prompt([
			{
				type: 'list',
				name: 'framework',
				message: 'Which framework are you using?',
				choices: ['react', 'vue', 'wordpress'],
			},
			{
				type: 'confirm',
				name: 'installDependencies',
				message: 'Install dependencies?',
				default: true,
			},
		]);

		const spinner = ora('Initializing Meshalto SDK...').start();

		try {
			const { framework, installDependencies } = answers;

			// Create .env.example if it doesn't exist
			const envExample = `VITE_MESHALTO_API_KEY=your_api_key_here
VITE_MESHALTO_API_URL=http://localhost:8002
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_SQUARE_APPLICATION_ID=your_square_app_id_here
VITE_SQUARE_LOCATION_ID=your_square_location_id_here`;

			await fs.writeFile('.env.example', envExample);

			if (!(await fs.pathExists('.env'))) {
				await fs.writeFile('.env', envExample);
			}

			if (installDependencies && framework === 'react') {
				spinner.text = 'Installing dependencies...';
				await execAsync('npm install @meshalto/react axios');
			}

			spinner.succeed(chalk.green('Meshalto SDK initialized!'));

			console.log(chalk.blue('\n📋 Next steps:'));
			console.log(chalk.white('  1. Update .env with your API keys'));
			console.log(
				chalk.white('  2. Import and use Meshalto components in your app')
			);
			console.log(
				chalk.blue(
					'\n📚 Documentation: https://github.com/johnakhilomen/meshalto-sdk\n'
				)
			);
		} catch (error: any) {
			spinner.fail(chalk.red('Initialization failed'));
			console.error(chalk.red('\nError:'), error.message);
			process.exit(1);
		}
	});

function generateRandomKey(length: number): string {
	const chars =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

program.parse(process.argv);
