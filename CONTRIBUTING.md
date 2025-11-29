# Contributing to Meshalto Payment SDK

Thank you for your interest in contributing to Meshalto Payment SDK! We welcome
contributions from the community.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (for frontend)
- **Python** 3.11+ (for backend)
- **Docker** (optional, for local development)
- **Git**

### Setting Up Development Environment

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/meshalto-payment-sdk.git
   cd meshalto-payment-sdk
   ```

2. **Backend Setup**

   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate

   # Install dependencies
   pip install -r sdk/server/requirements.txt
   pip install -r tests/requirements.txt
   ```

3. **Frontend Setup**

   ```bash
   cd sdk/vite-react
   npm install
   ```

4. **Environment Variables**
   ```bash
   cd sdk/server
   cp .env.example .env
   # Edit .env with your test API keys
   ```

## 🧪 Running Tests

### Backend Tests

```bash
# From project root
./run-tests.sh

# With coverage
./run-tests.sh --cov
```

### Frontend Unit/Smoke Tests

```bash
cd sdk/vite-react

# Run all tests
npm run test:unit

# Watch mode
npm run test

# With coverage
npm run test:coverage
```

### E2E Tests

```bash
cd sdk/vite-react

# Install Playwright browsers (first time only)
npm run test:install

# Run E2E tests
npm run test:e2e

# Interactive mode
npm run test:e2e:ui
```

## 📝 Code Style

### Python

- Follow PEP 8
- Use type hints where possible
- Maximum line length: 88 characters (Black formatter)
- Docstrings for all public functions

### TypeScript/React

- Use TypeScript for all new code
- Follow existing component patterns
- Use functional components with hooks
- Props should be typed with interfaces

### Formatting

```bash
# Python (if Black is installed)
black sdk/server tests/

# JavaScript/TypeScript
cd sdk/vite-react
npm run lint
```

## 🔀 Pull Request Process

1. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make Your Changes**

   - Write clear, concise code
   - Add tests for new features
   - Update documentation as needed

3. **Test Your Changes**

   ```bash
   # Backend
   ./run-tests.sh

   # Frontend
   cd sdk/vite-react
   npm run test:unit
   npm run test:e2e
   ```

4. **Commit Your Changes**

   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   **Commit Message Format:**

   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `test:` - Adding or updating tests
   - `refactor:` - Code refactoring
   - `chore:` - Maintenance tasks

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a Pull Request on GitHub.

## ✅ PR Checklist

Before submitting your PR, ensure:

- [ ] Code follows the project's style guidelines
- [ ] All tests pass (`./run-tests.sh` and `npm run test:unit`)
- [ ] New tests added for new features
- [ ] Documentation updated (README, inline comments, etc.)
- [ ] No console.log or debug code left in
- [ ] Commit messages are clear and descriptive
- [ ] PR description explains what and why

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description** - Clear description of the bug
2. **Steps to Reproduce** - Detailed steps to reproduce the issue
3. **Expected Behavior** - What you expected to happen
4. **Actual Behavior** - What actually happened
5. **Environment** - OS, Node version, Python version, etc.
6. **Screenshots** - If applicable

## 💡 Feature Requests

We love feature ideas! When suggesting features:

1. **Use Case** - Explain the problem you're trying to solve
2. **Proposed Solution** - How you think it should work
3. **Alternatives** - Other solutions you've considered
4. **Impact** - Who would benefit from this feature

## 📋 Development Guidelines

### Adding a New Payment Gateway

1. Create gateway client in `sdk/server/gateway_clients.py`
2. Add converter in `sdk/server/converters/base.py`
3. Update frontend component in `sdk/vite-react/src/`
4. Add E2E tests in `sdk/vite-react/e2e/`
5. Update documentation

### Code Review Process

- All PRs require at least one review
- Address all review comments
- Keep PRs focused and reasonably sized
- Be respectful and constructive in discussions

## 🎯 Areas for Contribution

We especially welcome contributions in:

- 🧪 **Testing** - More test coverage, edge cases
- 📚 **Documentation** - Tutorials, examples, API docs
- 🐛 **Bug Fixes** - Check our
  [Issues](https://github.com/johnakhilomen/meshalto-payment-sdk/issues)
- ⚡ **Performance** - Optimization improvements
- 🌍 **Internationalization** - Multi-language support
- ♿ **Accessibility** - A11y improvements

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all
contributors, regardless of age, body size, disability, ethnicity, gender
identity and expression, level of experience, nationality, personal appearance,
race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards others

**Unacceptable behavior:**

- Harassment, trolling, or derogatory comments
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## 📞 Getting Help

- **Documentation**: Check the [README](README.md) and other docs
- **Issues**: Search
  [existing issues](https://github.com/johnakhilomen/meshalto-payment-sdk/issues)
- **Discussions**: Use
  [GitHub Discussions](https://github.com/johnakhilomen/meshalto-payment-sdk/discussions)
- **Email**: support@meshalto.com

## 🙏 Thank You!

Your contributions help make Meshalto Payment SDK better for everyone. We
appreciate your time and effort!

---

**Happy Coding! 🚀**
