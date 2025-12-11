#!/bin/bash
# Start both backend and frontend servers

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Starting TRYGO SEO Agent..."
echo ""

# Kill existing processes on ports
echo "🧹 Cleaning up ports..."
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:4100 | xargs kill -9 2>/dev/null
lsof -ti:4200 | xargs kill -9 2>/dev/null
# Port 4300 no longer needed (images-service integrated into TRYGO-Backend)
lsof -ti:4400 | xargs kill -9 2>/dev/null
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
ensure_deps "$SCRIPT_DIR/backend" "tslib/package.json"
ensure_deps "$SCRIPT_DIR/TRYGO-Front" "react/package.json"
ensure_deps "$SCRIPT_DIR/semantics-service" "package.json"
ensure_deps "$SCRIPT_DIR/website-pages-service" "package.json"

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

# Start SEO Agent backend (port 4100) in background
echo "🔧 Starting SEO Agent backend (port 4100)..."
cd "$SCRIPT_DIR/backend"
npm run dev > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "SEO Agent Backend PID: $BACKEND_PID"

# Wait for SEO Agent backend to start and check if it's still running
sleep 3
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo "❌ SEO Agent backend failed to start! Check logs:"
  tail -20 "$SCRIPT_DIR/logs/backend.log"
  exit 1
fi
echo "✅ SEO Agent backend is running"

# Start semantics service
echo "🧠 Starting semantics service..."
cd "$SCRIPT_DIR/semantics-service"
npm run dev > "$SCRIPT_DIR/logs/semantics.log" 2>&1 &
SEMANTICS_PID=$!
echo "Semantics PID: $SEMANTICS_PID"

# Images service is now integrated into TRYGO-Backend (port 5001)
# No separate images-service needed

# Start website pages service
echo "🧾 Starting website pages service..."
cd "$SCRIPT_DIR/website-pages-service"
npm run dev > "$SCRIPT_DIR/logs/website-pages.log" 2>&1 &
WEBSITE_PAGES_PID=$!
echo "Website pages PID: $WEBSITE_PAGES_PID"

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
echo "📊 SEO Backend:   http://localhost:4100/graphql"
echo "🧠 Semantics:     http://localhost:4200"
echo "🧾 Website:       http://localhost:4400"
echo "🌐 Frontend:      http://localhost:8080"
echo ""
echo "📝 Logs:"
echo "   Main Backend:  tail -f $SCRIPT_DIR/logs/main-backend.log"
echo "   SEO Backend:   tail -f $SCRIPT_DIR/logs/backend.log"
echo "   Semantics:     tail -f $SCRIPT_DIR/logs/semantics.log"
echo "   Website Pages: tail -f $SCRIPT_DIR/logs/website-pages.log"
echo "   Frontend:      tail -f $SCRIPT_DIR/logs/frontend.log"
echo ""
echo "🛑 To stop: $SCRIPT_DIR/stop-all.sh"
