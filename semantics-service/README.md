## Semantics Service

Independent microservice that manages manual SEO clusters.

### Environment

Create `.env.local` (or set shell variables):

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster/trygo
SEMANTICS_SERVICE_PORT=4200
SEMANTICS_SERVICE_ORIGIN=http://localhost:5173
```

### Scripts

- `npm run dev` — start service with auto-reload
- `npm run build` — compile TypeScript
- `npm run start` — run compiled JS from `dist`

### API

- `GET /clusters?projectId=...&hypothesisId=...`
- `POST /clusters`
- `PUT /clusters/:id`
- `DELETE /clusters/:id`

