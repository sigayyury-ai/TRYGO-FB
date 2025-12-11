---
description: Start all TRYGO services (backend, frontend, semantics, images, website-pages)
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Execution

Execute the startup script to start all TRYGO services:

```bash
cd /Users/urok/Documents/TRYGO && chmod +x start-all.sh && ./start-all.sh
```

This will:
- Check and install dependencies automatically if missing (via `ensure_deps` function)
- Kill any existing processes on ports 4100, 4200, 4300, 4400, 5173
- Start backend on port 4100
- Start semantics service on port 4200
- Start images service on port 4300
- Start website-pages service on port 4400
- Start frontend on port 5173

All services run in the background. Logs are written to `logs/` directory.

**Auto-dependency check**: The script automatically checks if `node_modules` exist and runs `npm install` if dependencies are missing, preventing startup failures after cleaning `node_modules`.

## Service URLs

- Backend: http://localhost:4100
- Semantics: http://localhost:4200
- Images: http://localhost:4300
- Website Pages: http://localhost:4400
- Frontend: http://localhost:5173

## Notes

- Use `/stop-all` command to stop all services
- Services will be automatically restarted if they crash (via npm run dev watch mode)

