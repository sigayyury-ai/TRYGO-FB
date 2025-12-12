---
description: View server logs (backend, frontend, semantics, images, website-pages)
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Execution

View server logs from the `logs/` directory. Available log files:

- `main-backend.log` - Main TRYGO backend (port 5001)
- `backend.log` - SEO Agent backend (port 4100)
- `semantics.log` - Semantics service (port 4200)
- `images.log` - Images service (port 4300)
- `website-pages.log` - Website pages service (port 4400)
- `frontend.log` - Frontend (port 8080)

Execute the following command to view logs:

```bash
cd /Users/urok/Documents/TRYGO && \
ARGUMENTS="$ARGUMENTS" && \
LINES=50 && \
FOLLOW=false && \
LOG_FILE="" && \
\
# Parse arguments for number of lines \
if echo "$ARGUMENTS" | grep -qE '[0-9]+'; then \
  LINES=$(echo "$ARGUMENTS" | grep -oE '[0-9]+' | head -1); \
fi && \
\
# Check for follow/watch flag \
if echo "$ARGUMENTS" | grep -qiE 'follow|watch|-f'; then \
  FOLLOW=true; \
fi && \
\
# Determine which log file to show \
if echo "$ARGUMENTS" | grep -qiE 'main-backend|main'; then \
  LOG_FILE="logs/main-backend.log"; \
elif echo "$ARGUMENTS" | grep -qiE 'backend'; then \
  LOG_FILE="logs/backend.log"; \
elif echo "$ARGUMENTS" | grep -qiE 'semantics'; then \
  LOG_FILE="logs/semantics.log"; \
elif echo "$ARGUMENTS" | grep -qiE 'images'; then \
  LOG_FILE="logs/images.log"; \
elif echo "$ARGUMENTS" | grep -qiE 'website|pages'; then \
  LOG_FILE="logs/website-pages.log"; \
elif echo "$ARGUMENTS" | grep -qiE 'frontend|front'; then \
  LOG_FILE="logs/frontend.log"; \
fi && \
\
# Execute based on mode \
if [ "$FOLLOW" = true ] && [ -n "$LOG_FILE" ]; then \
  if [ -f "$LOG_FILE" ]; then \
    echo "👀 Following: $LOG_FILE (Ctrl+C to stop)" && \
    tail -f "$LOG_FILE"; \
  else \
    echo "❌ Log file $LOG_FILE not found"; \
  fi; \
elif [ -n "$LOG_FILE" ]; then \
  if [ -f "$LOG_FILE" ]; then \
    echo "📄 Viewing last $LINES lines of: $LOG_FILE" && \
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" && \
    tail -n "$LINES" "$LOG_FILE"; \
  else \
    echo "❌ Log file $LOG_FILE not found"; \
    echo "📋 Available logs:" && \
    ls -lh logs/*.log 2>/dev/null | awk '{print "  - " $9, "(" $5 ")"}'; \
  fi; \
else \
  echo "📋 Available log files:" && \
  ls -lh logs/*.log 2>/dev/null | awk '{print "  " $9, "(" $5 ")"}' && \
  echo "" && \
  for log in logs/main-backend.log logs/backend.log logs/semantics.log logs/images.log logs/website-pages.log logs/frontend.log; do \
    if [ -f "$log" ]; then \
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" && \
      echo "📄 $(basename $log) (last $LINES lines)" && \
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" && \
      tail -n "$LINES" "$log" && \
      echo ""; \
    fi; \
  done; \
fi
```

## Examples

- `/view-logs` - Show last 50 lines of all logs
- `/view-logs backend` - Show last 50 lines of backend.log
- `/view-logs frontend 200` - Show last 200 lines of frontend.log
- `/view-logs follow backend` - Follow backend.log in real-time
- `/view-logs main-backend 100` - Show last 100 lines of main-backend.log
- `/view-logs watch frontend` - Follow frontend.log in real-time

## Notes

- Logs are located in `/Users/urok/Documents/TRYGO/logs/`
- Use `follow` or `watch` to monitor logs in real-time (Ctrl+C to stop)
- Specify a number to control how many lines to show (default: 50)
- Log files are created automatically when services start via `/start-all`

