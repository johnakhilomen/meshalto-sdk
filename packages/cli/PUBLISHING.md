# Publishing @meshalto/cli to NPM

## Prerequisites

1. NPM account (sign up at https://www.npmjs.com/signup)
2. Two-factor authentication enabled
3. Access to publish under @meshalto scope

## Publishing Steps

### 1. Login to NPM

```bash
npm login
```

Enter your credentials when prompted.

### 2. Build the CLI

```bash
cd packages/cli
npm install
npm run build
```

### 3. Test Locally (Optional)

```bash
# Link globally for testing
npm link

# Test the commands
meshalto --help
meshalto create test-app

# Unlink when done
npm unlink -g @meshalto/cli
```

### 4. Verify Package Contents

```bash
npm pack --dry-run
```

This shows what files will be included in the package.

### 5. Publish to NPM

```bash
npm publish --access public
```

The `--access public` flag is required for scoped packages (@meshalto) on free
NPM accounts.

### 6. Verify Publication

```bash
# Check the package page
open https://www.npmjs.com/package/@meshalto/cli

# Test installation
npx @meshalto/cli --version
```

## Version Updates

When releasing a new version:

### 1. Update Version

```bash
cd packages/cli

# For bug fixes
npm version patch   # 0.1.0 -> 0.1.1

# For new features
npm version minor   # 0.1.0 -> 0.2.0

# For breaking changes
npm version major   # 0.1.0 -> 1.0.0
```

### 2. Build and Publish

```bash
npm run build
npm publish --access public
```

### 3. Update Git Tags

```bash
git push origin main --tags
```

## Troubleshooting

### "You do not have permission to publish"

Make sure you're logged in to the correct NPM account:

```bash
npm whoami
```

### "@meshalto scope not found"

The scope needs to be created first:

1. Go to https://www.npmjs.com
2. Create an organization named "meshalto"
3. Try publishing again

### Alternative: Publish without scope

If you don't want to use a scope, update `package.json`:

```json
{
	"name": "meshalto-cli" // instead of @meshalto/cli
}
```

Then publish:

```bash
npm publish
```

## What Gets Published

Files included (see `.npmignore`):

- ✅ `dist/` - Compiled JavaScript
- ✅ `README.md` - Documentation
- ✅ `package.json` - Package metadata

Files excluded:

- ❌ `src/` - TypeScript source
- ❌ `node_modules/` - Dependencies
- ❌ `.DS_Store` - System files
- ❌ Test files

## After Publishing

Users can install via:

```bash
# NPX (no installation)
npx @meshalto/cli create my-app

# Global install
npm install -g @meshalto/cli

# Alternative command
npx create-meshalto-app my-app
```

## Automated Publishing (Future)

Consider setting up GitHub Actions for automatic publishing:

```yaml
# .github/workflows/publish-cli.yml
name: Publish CLI
on:
  push:
    tags:
      - 'cli-v*'
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd packages/cli && npm install && npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
