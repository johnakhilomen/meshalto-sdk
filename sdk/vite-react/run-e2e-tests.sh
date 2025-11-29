#!/bin/bash

# E2E Test Setup and Run Script
# This script sets up and runs the complete E2E test suite

set -e

echo "🚀 Setting up E2E tests for Meshalto Payment SDK"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the vite-react directory.${NC}"
    exit 1
fi

# Step 1: Install dependencies
echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Step 2: Install Playwright browsers
echo -e "\n${YELLOW}🌐 Installing Playwright browsers...${NC}"
npx playwright install chromium

# Step 3: Check if backend is running
echo -e "\n${YELLOW}🔍 Checking backend server...${NC}"
if curl -s http://localhost:8002/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server is running${NC}"
else
    echo -e "${RED}⚠️  Backend server is not running${NC}"
    echo -e "${YELLOW}Starting backend server...${NC}"
    
    # Navigate to server directory and start docker
    cd ../server
    docker-compose up -d
    
    # Wait for server to be ready
    echo "Waiting for server to start..."
    sleep 10
    
    # Check again
    if curl -s http://localhost:8002/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend server started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start backend server${NC}"
        echo "Please start the backend manually with: cd ../server && docker-compose up -d"
    fi
    
    cd ../vite-react
fi

# Step 4: Check environment variables
echo -e "\n${YELLOW}🔐 Checking environment variables...${NC}"
if [ -f ".env" ]; then
    if grep -q "VITE_MESHALTO_API_KEY" .env && grep -q "VITE_STRIPE_PUBLISHABLE_KEY" .env; then
        echo -e "${GREEN}✅ Environment variables configured${NC}"
    else
        echo -e "${RED}⚠️  Missing environment variables in .env file${NC}"
        echo "Please ensure .env contains:"
        echo "  - VITE_MESHALTO_API_KEY"
        echo "  - VITE_STRIPE_PUBLISHABLE_KEY"
    fi
else
    echo -e "${RED}⚠️  No .env file found${NC}"
    echo "Creating .env.example for reference..."
    cat > .env.example << 'EOF'
VITE_MESHALTO_API_KEY=your-api-key-here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key-here
EOF
    echo -e "${YELLOW}Please copy .env.example to .env and add your credentials${NC}"
fi

# Step 5: Run tests
echo -e "\n${YELLOW}🧪 Running E2E tests...${NC}"
echo "================================================"

# Determine which test command to run
if [ "$1" == "--ui" ]; then
    echo "Running tests in UI mode..."
    npm run test:e2e:ui
elif [ "$1" == "--headed" ]; then
    echo "Running tests in headed mode..."
    npm run test:e2e:headed
elif [ "$1" == "--debug" ]; then
    echo "Running tests in debug mode..."
    npx playwright test --debug
else
    echo "Running tests in headless mode..."
    npm run test:e2e
fi

# Step 6: Show results
echo -e "\n${GREEN}✅ E2E test execution complete!${NC}"
echo "================================================"
echo ""
echo "📊 To view the HTML report, run:"
echo "   npx playwright show-report"
echo ""
echo "🎯 Test options:"
echo "   ./run-e2e-tests.sh          # Run headless"
echo "   ./run-e2e-tests.sh --ui     # Run with UI"
echo "   ./run-e2e-tests.sh --headed # Run with browser visible"
echo "   ./run-e2e-tests.sh --debug  # Run in debug mode"
echo ""
