# @meshalto/cli

CLI tool for quickly setting up Meshalto Payment SDK projects.

## Installation

### NPX (Recommended - No installation needed)

```bash
npx @meshalto/cli create my-payment-app
```

### Global Installation

```bash
npm install -g @meshalto/cli
```

### Alternative Command

```bash
npx create-meshalto-app my-payment-app
```

## Usage

### Create a New Project

```bash
# Interactive mode
npx @meshalto/cli create

# With project name
npx @meshalto/cli create my-payment-app

# Or using the create-meshalto-app alias
npx create-meshalto-app my-payment-app
```

The CLI will prompt you to:

1. Choose a framework (React, Vue, or WordPress)
2. Decide whether to include the backend API server
3. Select your preferred package manager (npm, yarn, or pnpm)

### Initialize in Existing Project

```bash
cd your-existing-project
npx @meshalto/cli init
```

## What Gets Created

### React Project Structure

```
my-payment-app/
├── sdk/
│   ├── vite-react/       # React payment components
│   │   ├── src/
│   │   ├── e2e/          # E2E tests
│   │   ├── .env          # Auto-generated
│   │   └── package.json
│   └── server/           # Backend API (optional)
│       ├── docker-compose.yml
│       ├── .env          # Auto-generated with API key
│       └── requirements.txt
└── README.md
```

### Features

✅ **Automatic Setup**

- Clones the latest Meshalto SDK
- Configures environment files
- Generates secure API keys
- Installs dependencies

✅ **Framework Choice**

- React (Vite + TypeScript)
- Vue.js
- WordPress Plugin

✅ **Backend Integration**

- Optional Docker-based API server
- Pre-configured payment gateways
- Auto-generated API authentication

✅ **Ready to Use**

- Payment forms with Stripe, Square, PayPal
- Customizable themes
- E2E tests included
- Complete documentation

## Quick Start After Creation

### Start Backend (if included)

```bash
cd my-payment-app/sdk/server
docker-compose up -d
```

### Start React Frontend

```bash
cd my-payment-app/sdk/vite-react
npm run dev
```

### Configure API Keys

Edit `.env` files:

- `sdk/server/.env` - Backend keys (Stripe, Square, PayPal)
- `sdk/vite-react/.env` - Frontend keys (Publishable keys)

## Commands

### `create [project-name]`

Creates a new Meshalto payment integration project

**Options:**

- Interactive prompts for framework, backend, package manager

### `init`

Initializes Meshalto SDK in an existing project

**Options:**

- Framework selection
- Dependency installation

## Environment Variables

The CLI automatically creates `.env` files with placeholders:

### Backend `.env`

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/meshalto
STRIPE_API_KEY=sk_test_your_key_here
SQUARE_ACCESS_TOKEN=your_token_here
SQUARE_LOCATION_ID=your_location_id_here
API_KEY=auto_generated_key
```

### Frontend `.env`

```env
VITE_MESHALTO_API_KEY=auto_generated_key
VITE_MESHALTO_API_URL=http://localhost:8002
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_SQUARE_APPLICATION_ID=your_app_id_here
```

## Requirements

- Node.js 18 or higher
- Docker (for backend server)

## Examples

### Create React app with backend

```bash
npx @meshalto/cli create
# Select: React, Yes to backend, npm
```

### Create WordPress plugin only

```bash
npx @meshalto/cli create
# Select: WordPress, No to backend
```

### Add to existing React app

```bash
cd existing-app
npx @meshalto/cli init
# Select: React, Yes to install dependencies
```

## Support

- 📚 [Documentation](https://github.com/johnakhilomen/meshalto-sdk)
- 🐛 [Issues](https://github.com/johnakhilomen/meshalto-sdk/issues)
- 💬 [Discussions](https://github.com/johnakhilomen/meshalto-sdk/discussions)

## License

MIT © John Akhilomen
