#!/bin/bash
echo "=========================================="
echo "  TimeVault - Start Local Server"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

# Try npm
if command -v npx &> /dev/null; then
    echo "[1/2] Starting with npx serve..."
    npx serve dist -l 8080
    exit 0
fi

# Try Python3
if command -v python3 &> /dev/null; then
    echo "[1/2] Starting with Python3..."
    cd dist && python3 -m http.server 8080
    exit 0
fi

# Try Python
if command -v python &> /dev/null; then
    echo "[1/2] Starting with Python..."
    cd dist && python -m http.server 8080
    exit 0
fi

echo "[Error] npm or Python not found."
echo "Please install Node.js (https://nodejs.org) or Python (https://python.org)"
read -p "Press Enter to exit..."
