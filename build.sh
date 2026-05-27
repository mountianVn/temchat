#!/bin/bash
set -e

echo "=== TeamChat Build Script for Railway ==="

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install

# Build client
echo "Building client..."
cd ../client
npm install
npm run build

# Go back to server directory
cd ../server

echo "=== Build complete ==="
