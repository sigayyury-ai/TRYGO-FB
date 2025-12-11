#!/bin/bash
# Start both backend and frontend servers

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Starting TRYGO SEO Agent..."
echo ""

# Kill existing processes on ports
echo "🧹 Cleaning up ports..."
lsof -ti:5001 | xargs kill -9 2>/dev/null
# Ports 4100, 4200, 4300, 4400 no longer needed (all services integrated into TRYGO-Backend)
lsof -ti:8080 | xargs kill -9 2>/dev/null
sleep 1

# Create logs directory if not exists
mkdir -p "$SCRIPT_DIR/logs"

ensure_deps() {
  local service_dir="$1"
  local dep_marker="$2"
  if [ ! -e "$service_dir/node_modules/$dep_marker" ]; then
    echo "📦 Installing dependencies for $(basename "$service_dir")..."
    (cd "$service_dir" && npm install)
  fi
}

# Ensure dependencies are installed for all services
ensure_deps "$SCRIPT_DIR/TRYGO-Backend" "package.json"
# backend, semantics-service, and website-pages-service are integrated into TRYGO-Backend - no separate installation needed
ensure_deps "$SCRIPT_DIR/TRYGO-Front" "react/package.json"

# Start main TRYGO backend (port 5001) in background
echo "🔧 Starting main TRYGO backend (port 5001)..."
cd "$SCRIPT_DIR/TRYGO-Backend"
npm run dev > "$SCRIPT_DIR/logs/main-backend.log" 2>&1 &
MAIN_BACKEND_PID=$!
echo "Main Backend PID: $MAIN_BACKEND_PID"

# Wait for main backend to start
sleep 3
if ! kill -0 $MAIN_BACKEND_PID 2>/dev/null; then
  echo "❌ Main backend failed to start! Check logs:"
  tail -20 "$SCRIPT_DIR/logs/main-backend.log"
  exit 1
fi
echo "✅ Main backend is running"

# SEO Agent backend, semantics-service, and website-pages-service are now integrated into TRYGO-Backend
# No separate services needed - all functionality available through port 5001

# Wait for services to warm up
sleep 2

# Start frontend in background
echo "🎨 Starting frontend..."
cd "$SCRIPT_DIR/TRYGO-Front"
npm run dev > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait and check frontend
sleep 3
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
  echo "❌ Frontend failed to start! Check logs:"
  tail -20 "$SCRIPT_DIR/logs/frontend.log"
fi

echo ""
echo "✅ Servers started!"
echo "📊 Main Backend:  http://localhost:5001/graphql"
echo "   Images API:    http://localhost:5001/api/images/generate"
echo "   Clusters API:  http://localhost:5001/api/clusters"
echo "   Website Pages:  http://localhost:5001/api/website-pages/generate"
echo "   (SEO Agent, Images, Clusters, Website Pages integrated)"
echo "🌐 Frontend:      http://localhost:8080"
echo ""
echo "📝 Logs:"
echo "   Main Backend:  tail -f $SCRIPT_DIR/logs/main-backend.log"
echo "   Frontend:      tail -f $SCRIPT_DIR/logs/frontend.log"
echo ""
echo "🛑 To stop: $SCRIPT_DIR/stop-all.sh"
