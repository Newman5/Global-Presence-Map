#!/bin/bash

# Build and Test Script
# This script builds the static site and optionally serves it locally for testing

set -e

echo "🌍 Building Global Presence Map..."
npm run build

echo "✅ Build complete! Static files are in the ./out directory"
echo ""
echo "To test locally, you can use one of these methods:"
echo ""
echo "1. Using Python's built-in server:"
echo "   cd out && python3 -m http.server 8000"
echo ""
echo "2. Using Node's http-server (if installed):"
echo "   npx http-server out -p 8000"
echo ""
echo "3. Using serve (if installed):"
echo "   npx serve out"
echo ""

read -p "Would you like to serve the site locally now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Starting local server on http://localhost:8000"
    cd out && python3 -m http.server 8000
fi
