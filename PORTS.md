# Ports Configuration

This document describes the ports used by different services in the TRYGO project.

## Backend Services

### Main TRYGO Backend (TRYGO-Backend)
- **Port**: `5001`
- **GraphQL Endpoint**: `http://localhost:5001/graphql`
- **Purpose**: Main backend for authentication, projects, hypotheses, and core TRYGO functionality
- **Location**: `TRYGO-Backend/`
- **Environment Variable**: `VITE_SERVER_URL` (frontend)

### SEO Agent Backend
- **Port**: `4100`
- **GraphQL Endpoint**: `http://localhost:4100/graphql`
- **Purpose**: SEO Agent specific functionality (backlog, clusters, content ideas, posting settings)
- **Location**: `backend/`
- **Environment Variable**: `VITE_SEO_AGENT_URL` (frontend)

### Semantics Service
- **Port**: `4200`
- **Purpose**: Keyword discovery and semantic clustering service
- **Location**: `semantics-service/`
- **Environment Variable**: `SEMANTICS_SERVICE_URL` (backend)

### Images Service
- **Port**: `4300`
- **Purpose**: Image generation and storage for content drafts
- **Location**: `images-service/`
- **Environment Variable**: `IMAGES_SERVICE_URL` (backend)

### Website Pages Service
- **Port**: `4400`
- **Purpose**: Website page generation and management
- **Location**: `website-pages-service/`
- **Environment Variable**: `WEBSITE_PAGES_SERVICE_URL` (backend)

## Frontend

### TRYGO Frontend (TRYGO-Front)
- **Port**: `8080` (or `5173` if using default Vite)
- **URL**: `http://localhost:8080/`
- **Purpose**: Main frontend application
- **Location**: `TRYGO-Front/`

## Environment Variables

### Frontend (.env)
```env
# Main backend (authentication, projects, etc.)
VITE_SERVER_URL=http://localhost:5001/graphql
VITE_WS_SERVER_URL=ws://localhost:5001

# SEO Agent backend (SEO-specific features)
VITE_SEO_AGENT_URL=http://localhost:4100/graphql
```

### SEO Agent Backend (backend/.env)
```env
PORT=4100
FRONTEND_URL=http://localhost:8080
MONGODB_URI=your_mongodb_uri
SEMANTICS_SERVICE_URL=http://localhost:4200
IMAGES_SERVICE_URL=http://localhost:4300
WEBSITE_PAGES_SERVICE_URL=http://localhost:4400
```

### Main Backend (TRYGO-Backend/.env)
```env
PORT=5001
```

### Semantics Service (semantics-service/.env)
```env
PORT=4200
```

### Images Service (images-service/.env)
```env
PORT=4300
```

### Website Pages Service (website-pages-service/.env)
```env
PORT=4400
```

## Port Summary

| Service | Port | Purpose |
|---------|------|---------|
| Main Backend | 5001 | Authentication, projects, core TRYGO |
| SEO Agent Backend | 4100 | SEO-specific features |
| Semantics Service | 4200 | Keyword discovery, clustering |
| Images Service | 4300 | Image generation, storage |
| Website Pages Service | 4400 | Website page generation |
| Frontend | 8080 | Main frontend application |

## Notes

- The main backend (5001) handles authentication and core TRYGO features
- The SEO Agent backend (4100) handles SEO-specific features
- Frontend uses separate Apollo Clients for each backend
- All services can run simultaneously on different ports
- Semantics, Images, and Website Pages services are microservices used by the SEO Agent backend

