# 🚀 Meshalto Payment SDK

**One API. Multiple Payment Gateways. Automatic Cost Optimization.**

Accept payments through Stripe, Square, and PayPal with a single unified API.
Meshalto automatically routes each transaction to the cheapest gateway, saving
you 30-40% on processing fees.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Frontend Tests](https://github.com/johnakhilomen/meshalto-payment-sdk/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/johnakhilomen/meshalto-payment-sdk/actions/workflows/e2e-tests.yml)

---

## ⚡ Quick Start (5 Minutes)

### Option 1: Use the CLI (Easiest)

```bash
# Create a new project with everything set up
npx @meshalto/cli create my-payment-app

# Or use the alternative command
npx create-meshalto-app my-payment-app
```

The CLI will:

- ✅ Set up your chosen framework (React/Vue/WordPress)
- ✅ Configure environment files
- ✅ Install dependencies
- ✅ Generate secure API keys
- ✅ Optionally include the backend server

### Option 2: Use Pre-built Components

```bash
# React
npm install @meshalto/react

# Vue
npm install @meshalto/vue
```

```jsx
import { MeshaltoPayment } from '@meshalto/react';

<MeshaltoPayment
	apiUrl="https://api.meshalto.com"
	apiKey="your_api_key"
	amount={99.99}
	onSuccess={(result) => console.log(result)}
/>;
```

### Option 3: Run the API locally

```bash
git clone https://github.com/johnakhilomen/meshalto-payment-sdk
cd meshalto-payment-sdk/sdk/server
cp .env.example .env
# Add your gateway API keys to .env
docker-compose up
```

Your API is now running at `http://localhost:8002`

---

## 📁 Repository Structure

```
meshalto-payment-sdk/
├── packages/
│   └── cli/                 # @meshalto/cli - Project setup tool
│       ├── src/
│       ├── README.md
│       └── package.json
├── sdk/
│   ├── server/              # FastAPI backend API
│   │   ├── main.py          # API server
│   │   ├── payment_processor.py
│   │   ├── gateway_clients.py
│   │   └── docker-compose.yml
│   ├── vite-react/          # React SDK & Component
│   │   ├── src/
│   │   │   ├── MeshaltoPayment.tsx
│   │   │   ├── StripePaymentForm.tsx
│   │   │   └── SquarePaymentForm.tsx
│   │   └── e2e/             # E2E tests
│   └── vue/                 # Vue SDK (coming soon)
├── tests/                   # Python unit tests
├── scripts/                 # Setup and utility scripts
├── E2E_TESTING.md          # E2E testing documentation
├── STRUCTURE_EXPLAINED.md  # Detailed project structure
└── README.md               # This file
```

---

## 💰 Why Meshalto?

**Automatic Gateway Selection** saves you money on every transaction:

| Gateway | Processing Fee | Best For           |
| ------- | -------------- | ------------------ |
| Stripe  | 2.9% + $0.30   | Default choice     |
| Square  | 2.6% + $0.10   | Large transactions |
| PayPal  | 2.89% + $0.49  | International      |

**Example:** $1000 transaction

- Stripe: $29.30
- Square: $26.10 ✅ (saves $3.20)
- Meshalto picks Square automatically

---

## 📚 Documentation

### Core Documentation

- **[Project Structure](STRUCTURE_EXPLAINED.md)** - Detailed explanation of the
  codebase
- **[SDK Release Plan](SDK_RELEASE_PLAN.md)** - Packaging and distribution
  strategy
- **[E2E Testing Guide](E2E_TESTING.md)** - Complete automated testing
  documentation

### Component Guides

- **[React Component](sdk/vite-react/README.md)** - React integration guide
- **[Vue Component](sdk/vue/README.md)** - Vue 3 integration guide
- **[Backend API](sdk/server/README.md)** - FastAPI server documentation
- **[Python Tests](tests/README.md)** - Backend testing guide

### E2E Testing Resources

- [E2E Test Cheatsheet](sdk/vite-react/E2E_CHEATSHEET.md) - Quick reference
- [E2E Architecture](sdk/vite-react/E2E_ARCHITECTURE.md) - System diagrams
- [E2E Setup Complete](sdk/vite-react/E2E_SETUP_COMPLETE.md) - Implementation
  details

---

## 🧪 Testing

### Automated E2E Tests (Frontend)

Full automated UI testing with Playwright for payment gateways:

```bash
cd sdk/vite-react

# Run all E2E tests
npm run test:e2e

# Run in CI mode (headless)
npm run test:e2e:ci

# Interactive UI mode
npm run test:e2e:ui

# Visible browser mode
npm run test:e2e:headed
```

**Test Coverage:**

- ✅ Stripe payment processing with test cards
- ✅ Square payment processing with test cards
- ✅ Gateway switching functionality
- ✅ Form validation and error handling
- ✅ Success/error notifications
- ✅ Backend API integration

**Test Cards:**

```
Stripe Success:  4242 4242 4242 4242
Square Success:  4111 1111 1111 1111
Expiry: 12/34 | CVC: 123 | ZIP: 12345
```

See [E2E_TESTING.md](E2E_TESTING.md) for complete documentation.

### Unit & Smoke Tests (Frontend)

Fast unit and smoke tests for React components:

```bash
cd sdk/vite-react

# Run all unit tests
npm run test:unit

# Run smoke tests only
npm run test:smoke

# Watch mode
npm run test

# With coverage
npm run test:coverage
```

---

## 🎯 What's in the SDK?

### 1. Backend API (`sdk/server/`)

- FastAPI-based REST API
- Stripe, Square, PayPal integration
- Automatic gateway selection
- Transaction history
- PCI-compliant architecture

### 2. React Component (`sdk/react/`)

- Beautiful pre-built payment form
- TypeScript support
- Light/dark themes
- Card input validation
- One-line integration

### 3. Vue Component (`sdk/vue/`)

- Vue 3 Composition API
- Same features as React
- Reactive props
- Event emitters
- Type-safe

---

## 🚀 Deployment

Deploy in under 5 minutes:

```bash

# Docker
docker-compose up -d

# AWS/GCP/Azure
See docs/deployment.md
```

---

## 🔒 Security

- ✅ PCI DSS Level 1 compliant
- ✅ HTTPS/TLS required
- ✅ API key authentication
- ✅ Rate limiting
- ✅ Input validation
- ✅ Encrypted at rest

---

## 🧪 Testing

### Python Backend Tests

We use a virtual environment to manage Python dependencies:

```bash
# Run tests (automatically manages virtual environment)
./run-tests.sh

# Run tests with coverage report
./run-tests.sh --cov
```

The test script will:

- ✅ Create a virtual environment if it doesn't exist
- ✅ Install all required dependencies
- ✅ Run the test suite
- ✅ Automatically activate/deactivate the virtual environment

**Manual testing (if needed):**

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r sdk/server/requirements.txt
pip install -r tests/requirements.txt

# Run tests
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
pytest tests/ -v

# Deactivate when done
deactivate
```

---

## 🎯 What's in the SDK?

### 1. Backend API (`sdk/server/`)

- FastAPI-based REST API
- Stripe, Square, PayPal integration
- Automatic gateway selection based on fees
- Transaction history and management
- PCI-compliant architecture

### 2. React Component (`sdk/vite-react/`)

- Beautiful pre-built payment form
- TypeScript support
- Multiple themes (light/dark/ocean)
- Card input validation
- One-line integration

### 3. Vue Component (`sdk/vue/`)

- Vue 3 Composition API
- Reactive props and events
- Type-safe with TypeScript
- Same features as React component
- _(Coming soon)_

---

## 🚀 Deployment

Deploy your own instance in minutes:

### Railway (Free Tier)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

See [sdk/server/README.md](sdk/server/README.md) for detailed deployment
instructions including AWS, GCP, Azure, and more.

---

## 🔒 Security

- ✅ PCI DSS Level 1 compliant architecture
- ✅ HTTPS/TLS required in production
- ✅ API key authentication
- ✅ Rate limiting on all endpoints
- ✅ Input validation and sanitization
- ✅ No raw card data stored (tokenized only)
- ✅ Encrypted database connections

**Security Best Practices:**

- Never commit API keys to version control
- Use environment variables for sensitive data
- Rotate API keys regularly
- Monitor transaction logs for anomalies

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests: `./run-tests.sh` and `cd sdk/vite-react && npm run test:unit`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

Please ensure:

- ✅ All tests pass
- ✅ Code follows existing style
- ✅ Documentation is updated
- ✅ Commit messages are clear

For detailed guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 💬 Support & Community

- **Documentation**: Check the links in the [📚 Documentation](#-documentation)
  section
- **Issues**:
  [GitHub Issues](https://github.com/johnakhilomen/meshalto-payment-sdk/issues)
- **Discussions**:
  [GitHub Discussions](https://github.com/johnakhilomen/meshalto-payment-sdk/discussions)
- **Email**: me@johnakhilomen.com

---

## 🗺️ Roadmap

- [x] Stripe integration
- [x] Square integration
- [x] PayPal integration
- [x] Automatic gateway selection
- [x] React component
- [x] E2E testing suite
- [x] Unit & smoke tests
- [ ] Vue 3 component
- [ ] Additional payment methods (Apple Pay, Google Pay)
- [ ] Subscription/recurring payment support
- [ ] Advanced analytics dashboard
- [ ] Multi-currency support
- [ ] Webhook management UI

---

**Made with ❤️ by John Akhilomen**
