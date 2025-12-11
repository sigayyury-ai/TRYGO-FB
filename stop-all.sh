#!/bin/bash
# Stop all servers

echo "🛑 Stopping TRYGO servers..."

# Kill processes on ports
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:4100 | xargs kill -9 2>/dev/null
lsof -ti:4200 | xargs kill -9 2>/dev/null
lsof -ti:4300 | xargs kill -9 2>/dev/null
lsof -ti:4400 | xargs kill -9 2>/dev/null
lsof -ti:8080 | xargs kill -9 2>/dev/null

echo "✅ All servers stopped"
