#!/bin/bash

# ============================================
#    TeamChat - Internal Chat App
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}   TeamChat - Internal Chat App${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed!${NC}"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not found!${NC}"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} npm found: $(npm --version)"
echo ""

# Install dependencies
echo -e "${YELLOW}[1/4] Installing server dependencies...${NC}"
if [ ! -d "server/node_modules" ]; then
    cd server && npm install && cd ..
else
    echo -e "${GREEN}[SKIP]${NC} Already installed"
fi

echo -e "${YELLOW}[2/4] Installing client dependencies...${NC}"
if [ ! -d "client/node_modules" ]; then
    cd client && npm install && cd ..
else
    echo -e "${GREEN}[SKIP]${NC} Already installed"
fi

# Start backend
echo -e "${YELLOW}[3/4] Starting server on port 3001...${NC}"
cd server && npm run dev &
cd ..

# Wait for server
sleep 3

# Start frontend
echo -e "${YELLOW}[4/4] Starting frontend...${NC}"
cd client && npm run dev &
cd ..

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}   TeamChat is starting...${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "${GREEN}Login page:${NC}     http://localhost:5173"
echo -e "${GREEN}API server:${NC}      http://localhost:3001"
echo ""
echo -e "${YELLOW}Demo accounts:${NC}"
echo "  alice, bob, carol, david, emma, frank, grace, henry"
echo "  Password: password123"
echo ""

# Open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Opening browser..."
    sleep 2
    open http://localhost:5173
else
    echo "Opening browser..."
    sleep 2
    xdg-open http://localhost:5173 2>/dev/null || echo "Please open http://localhost:5173 in your browser"
fi

echo ""
echo -e "${GREEN}Servers are running!${NC}"
echo "Press Ctrl+C to stop."
echo ""

# Wait
trap "echo ''; echo 'Stopping servers...'; pkill -f 'nodemon' 2>/dev/null; pkill -f 'vite' 2>/dev/null; exit 0" SIGINT SIGTERM

while true; do
    sleep 30
done
