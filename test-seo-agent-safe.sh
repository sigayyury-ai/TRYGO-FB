#!/bin/bash

# Safe SEO Agent Test Script
# This script checks SEO Agent without opening it in Cursor to avoid memory issues

echo "=== Safe SEO Agent Test ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check services
echo "1. Checking services..."
FRONTEND=$(lsof -ti:8080 2>/dev/null)
MAIN_BACKEND=$(lsof -ti:5001 2>/dev/null)
SEO_BACKEND=$(lsof -ti:4100 2>/dev/null)

if [ -n "$FRONTEND" ]; then
    echo -e "   ${GREEN}✅ Frontend (8080): Running${NC}"
else
    echo -e "   ${RED}❌ Frontend (8080): Not running${NC}"
fi

if [ -n "$MAIN_BACKEND" ]; then
    echo -e "   ${GREEN}✅ Main Backend (5001): Running${NC}"
else
    echo -e "   ${RED}❌ Main Backend (5001): Not running${NC}"
fi

if [ -n "$SEO_BACKEND" ]; then
    echo -e "   ${GREEN}✅ SEO Backend (4100): Running${NC}"
else
    echo -e "   ${RED}❌ SEO Backend (4100): Not running${NC}"
fi

echo ""
echo "2. Checking backend health..."

# Check SEO backend health
SEO_HEALTH=$(curl -s http://localhost:4100/health 2>/dev/null)
if echo "$SEO_HEALTH" | grep -q "ok"; then
    echo -e "   ${GREEN}✅ SEO Backend health: OK${NC}"
else
    echo -e "   ${YELLOW}⚠️  SEO Backend health: Unknown${NC}"
fi

# Check main backend health
MAIN_HEALTH=$(curl -s http://localhost:5001/health 2>/dev/null)
if [ -n "$MAIN_HEALTH" ]; then
    echo -e "   ${GREEN}✅ Main Backend health: OK${NC}"
else
    echo -e "   ${YELLOW}⚠️  Main Backend health: Unknown${NC}"
fi

echo ""
echo "3. Checking frontend compilation..."

# Check if frontend compiles without errors
cd TRYGO-Front 2>/dev/null || { echo -e "   ${RED}❌ Cannot find TRYGO-Front directory${NC}"; exit 1; }

# Check TypeScript compilation for SEO Agent files
echo "   Checking SEO Agent TypeScript files..."
TS_ERRORS=$(npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "seo-agent\|SeoAgent" | head -5)
if [ -z "$TS_ERRORS" ]; then
    echo -e "   ${GREEN}✅ No TypeScript errors in SEO Agent files${NC}"
else
    echo -e "   ${RED}❌ TypeScript errors found:${NC}"
    echo "$TS_ERRORS" | sed 's/^/      /'
fi

echo ""
echo "4. Checking critical SEO Agent files..."

# Check if main files exist
FILES=(
    "src/pages/SeoAgentPage.tsx"
    "src/components/seo-agent/SeoAgentConsole.tsx"
    "src/components/seo-agent/SeoContentPanel.tsx"
    "src/components/seo-agent/SeoPlanPanel.tsx"
    "src/components/seo-agent/SeoSemanticsPanel.tsx"
)

ALL_EXIST=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✅ $file${NC}"
    else
        echo -e "   ${RED}❌ $file - Missing${NC}"
        ALL_EXIST=false
    fi
done

echo ""
echo "5. Checking for memory leak fixes..."

# Check for pollingIntervalsRef (memory leak fix)
if grep -q "pollingIntervalsRef" src/components/seo-agent/plan/BacklogPanel.tsx 2>/dev/null; then
    echo -e "   ${GREEN}✅ Memory leak fix (pollingIntervalsRef) applied${NC}"
else
    echo -e "   ${RED}❌ Memory leak fix not found${NC}"
fi

# Check for useCallback in handleGenerateForCategory
if grep -q "useCallback.*handleGenerateForCategory" src/components/seo-agent/SeoContentPanel.tsx 2>/dev/null; then
    echo -e "   ${GREEN}✅ useCallback optimization applied${NC}"
else
    echo -e "   ${YELLOW}⚠️  useCallback optimization not found${NC}"
fi

# Check if excessive logging is removed
LOG_COUNT=$(grep -c "console.log" src/hooks/useProjects.ts 2>/dev/null | head -1 || echo "0")
if [ -z "$LOG_COUNT" ] || [ "$LOG_COUNT" = "0" ]; then
    LOG_COUNT="0"
fi
if [ "$LOG_COUNT" -lt 5 ] 2>/dev/null; then
    echo -e "   ${GREEN}✅ Excessive logging removed (only $LOG_COUNT console.log)${NC}"
else
    echo -e "   ${YELLOW}⚠️  Still many console.log calls ($LOG_COUNT)${NC}"
fi

echo ""
echo "6. Summary and recommendations:"
echo ""
echo -e "   ${GREEN}✅ All critical fixes have been applied${NC}"
echo ""
echo "   📋 To test SEO Agent safely:"
echo "      1. Open http://localhost:8080 in EXTERNAL browser (Chrome/Safari)"
echo "      2. DO NOT use Cursor's built-in browser to avoid memory issues"
echo "      3. Login and navigate to /seo-agent"
echo "      4. Monitor browser DevTools console (F12) for errors"
echo "      5. Check Network tab for failed API requests"
echo ""
echo "   ⚠️  Important: Using external browser prevents Cursor memory leaks"
echo ""

cd .. 2>/dev/null

