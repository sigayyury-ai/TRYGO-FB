#!/bin/bash
# Stop all servers

echo "🛑 Stopping TRYGO servers..."

# Kill processes on ports
lsof -ti:5001 | xargs kill -9 2>/dev/null
# Ports 4100, 4200, 4300, 4400 no longer needed (all services integrated into TRYGO-Backend)
lsof -ti:8080 | xargs kill -9 2>/dev/null

echo "✅ All servers stopped"
