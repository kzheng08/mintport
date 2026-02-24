#!/bin/bash
set -e

echo "Installing Node.js..."
/opt/homebrew/bin/brew install node

echo ""
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""
echo "All done! You're ready to build."
