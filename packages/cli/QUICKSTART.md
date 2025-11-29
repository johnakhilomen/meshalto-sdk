# Meshalto CLI - Quick Start

## Installation & Usage

### Option 1: NPX (Recommended - No Installation)

```bash
npx @meshalto/cli create my-payment-app
```

### Option 2: Alternative Command

```bash
npx create-meshalto-app my-payment-app
```

### Option 3: Global Installation

```bash
npm install -g @meshalto/cli
meshalto create my-payment-app
```

## What It Does

The Meshalto CLI automates the setup of payment integration projects:

1. ✅ Downloads the latest Meshalto SDK
2. ✅ Sets up your chosen framework (React/Vue/WordPress)
3. ✅ Configures environment files with secure API keys
4. ✅ Installs all dependencies
5. ✅ Optionally includes the backend API server

## Interactive Setup

Simply run:

```bash
npx @meshalto/cli create
```

You'll be prompted to choose:

- **Project name**
- **Framework** (React, Vue, or WordPress)
- **Backend server** (Yes/No)
- **Package manager** (npm, yarn, or pnpm)

## Example Session

```bash
$ npx @meshalto/cli create

🚀 Welcome to Meshalto Payment SDK Setup!

? Project name: my-store-payments
? Which framework do you want to use? React (Vite + TypeScript)
? Do you want to include the backend API server? Yes
? Which package manager do you want to use? npm

✓ Creating project structure...
✓ Downloading Meshalto SDK...
✓ Setting up React project...
✓ Installing React dependencies with npm...
✓ Setting up backend server...
✓ Project created successfully!

📋 Next Steps:

  cd my-store-payments

  🔧 Configure your API keys in the .env files:
     - sdk/server/.env (Stripe, Square, PayPal keys)
     - sdk/vite-react/.env (Frontend keys)

  🐳 Start the backend server:
     cd sdk/server
     docker-compose up -d

  🚀 Start the React development server:
     cd sdk/vite-react
     npm run dev

📚 Documentation: https://github.com/johnakhilomen/meshalto-sdk

✨ Happy coding!
```

## Commands

### `create [project-name]`

Create a new payment integration project

### `init`

Add Meshalto to an existing project

## Requirements

- Node.js 18+
- Docker (for backend server)

## Publishing to NPM

To publish this CLI to npm (for maintainers):

```bash
cd packages/cli
npm run build
npm publish --access public
```

## Local Development

```bash
cd packages/cli
npm install
npm run build

# Test locally
node dist/index.js create test-app

# Or link globally
npm link
meshalto create test-app
```

## Features

- 🎨 Multiple framework support
- 🔐 Auto-generated API keys
- 📦 Smart dependency installation
- 🐳 Docker backend setup
- ✨ Interactive CLI experience
- 🚀 Zero-config start

## Support

Issues: https://github.com/johnakhilomen/meshalto-sdk/issues
