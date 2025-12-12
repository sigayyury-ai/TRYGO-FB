#!/bin/bash

# Safe server startup script
# Checks if port is in use and optionally kills existing processes

PORT=${PORT:-5001}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍 Checking if port $PORT is in use..."

# Check if port is in use
if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "⚠️  Port $PORT is already in use!"
    echo "📋 Processes using port $PORT:"
    lsof -ti:$PORT | while read pid; do
        ps -p $pid -o pid,command | tail -1
    done
    
    echo ""
    read -p "Kill existing processes on port $PORT? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 Killing processes on port $PORT..."
        lsof -ti:$PORT | xargs kill -9 2>/dev/null
        sleep 2
        echo "✅ Processes killed"
    else
        echo "❌ Exiting. Please stop the existing server manually."
        exit 1
    fi
else
    echo "✅ Port $PORT is free"
fi

echo ""
echo "🚀 Starting server..."

# Check if we're in development or production mode
if [ -f "$SCRIPT_DIR/.env" ] && grep -q "NODE_ENV=production" "$SCRIPT_DIR/.env" 2>/dev/null; then
    echo "📦 Production mode: building and starting..."
    npm run build && npm run start
else
    echo "🔧 Development mode: starting with ts-node-dev..."
    npm run dev
fi
