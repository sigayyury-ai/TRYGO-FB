---
description: Stop all TRYGO services (backend, frontend, semantics, images, website-pages)
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Execution

Execute the stop script to stop all running TRYGO services:

```bash
cd /Users/urok/Documents/TRYGO && chmod +x stop-all.sh && ./stop-all.sh
```

This will kill all processes on ports 4100, 4200, 4300, 4400, 5173.

## Notes

- All services will be terminated
- Use `/start-all` command to start services again

