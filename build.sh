#!/bin/bash

# Development helper script for the knihy project

echo "📚 Knihy - Development Helper"
echo "=============================="

# Check if Python is available
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.x"
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python"
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
fi

echo "🔄 Converting CSV to JavaScript..."
$PYTHON_CMD csv_to_js.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Data conversion successful!"
    echo "🌐 You can now open index.html in your browser"
    echo ""
    echo "📁 Files updated:"
    echo "   - books-data.js (auto-generated)"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Open index.html in your browser to test locally"
    echo "   2. Commit and push changes to deploy to GitHub Pages"
    
    # Check if git is available and show git status
    if command -v git &> /dev/null && [ -d ".git" ]; then
        echo ""
        echo "📋 Git status:"
        git status --porcelain
    fi
else
    echo "❌ Data conversion failed!"
    exit 1
fi
