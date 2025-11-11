# SalesScout

![SalesScout](cover.png)

A full-stack TypeScript application for tracking and monitoring deals from RedFlagDeals. Automatically scrapes deal listings, allows users to create custom queries, and notifies when matching deals are found.

> NOTE: This project was initally written for CPSC-2650. I did a re-design and added security features while keeping the core of it the same (restrictions, functionality etc.) so I can host & showcase it.

## Architecture

- **Backend**: Express.js with TypeScript, MongoDB for data persistence, JWT authentication, automated scheduling service for periodic scraping.
- **Frontend**: React 19 with TypeScript, React Router for navigation, context-based state management, Webpack build pipeline.
- **Infrastructure**: Multi-stage Docker builds with Nginx-based frontend, MongoDB 6, production-ready containerization with health checks.

## Features

- JWT-based authentication with bcryptjs password hashing
- Automated deal scraping from forums using Cheerio web scraper
- Custom queries with keyword matching and category filtering
- Webhook notifications when deals match your queries
- Background scheduler for automated query execution and deal updates
- Configurable rate limits on authentication, API endpoints, and scraping
- Read-only demo account with request tracking and analytics
- Security middleware: Helmet, CORS, request size limits (10kb), CSP headers
- Admin user creation scripts and demo user setup
- Optional Umami analytics integration for privacy-focused tracking
- Light/dark theme support with context-based state management

## API Routes

### Users (`/api/users`)
- `GET /config` - Application configuration (public, returns demoMode and registrationEnabled)
- `POST /register` - User registration (rate limited: 5 per 15 min)
- `POST /login` - User authentication (rate limited: 5 per 15 min)
- `GET /profile` - Get user profile (protected, JWT required)

### Deals (`/api/deals`)
- `GET /` - Retrieve all deals with pagination and filtering
- `GET /scrape` - Manually trigger deal scraping (protected, strict rate limit: 3 per 15 min)

### Queries (`/api/queries`)
- `POST /` - Create new query (protected, blocked in demo mode)
- `GET /` - Get user's queries (protected)
- `GET /:id` - Get query details and matched deals (protected)
- `PUT /:id` - Update query (protected, blocked in demo mode)
- `DELETE /:id` - Delete query (protected, blocked in demo mode)

All protected routes require JWT authentication via `Authorization: Bearer <token>` header.

## Key Features Explained

### Query Scheduler
- Automatically executes active queries based on configured intervals
- Runs in background using Node.js setTimeout
- Searches for new deals matching query keywords and categories
- Triggers webhook notifications when matches are found
- Handles rescheduling and cleanup of inactive queries

### Demo Mode
- Read-only account for testing (username: `demo`, password: `Demo1234!`)
- Prevents modifications (POST, PUT, DELETE, PATCH requests blocked)
- Tracks demo user activity with request metadata
- Automatically created on backend startup when `DEMO_MODE=true`

### Rate Limiting
- Configurable via environment variables
- Three tiers:
  - General API: 100 requests per 15 minutes (default)
  - Authentication: 5 requests per 15 minutes (default)
  - Scraping: 3 requests per 15 minutes (default)
- IP-based tracking with express-rate-limit

### Analytics (Optional)
- Privacy-focused Umami analytics integration
- Comprehensive event tracking utility (`utils/umami.ts`)
- Custom hook for page view tracking
- Tracks authentication, queries, deals, errors, and performance
- CSP headers configured to allow Umami script
- Fully optional and configurable

## Security Features

- Helmet security headers including CSP, HSTS, X-Frame-Options
- Configurable CORS allowed origins
- 10kb request size limit to prevent DoS attacks
- Secure JWT token-based authentication with bcryptjs hashing
- Multi-tier rate limiting protection against abuse
- Docker images run as non-privileged users
- Input validation with express-validator
- Sensitive configuration stored in .env (not committed)

## Project Structure

```
├── client/                     # React 19 frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── auth/          # Login, Register, Profile
│   │   │   ├── dashboard/     # Dashboard view
│   │   │   ├── layout/        # Header, Footer
│   │   │   ├── queries/       # Query management (List, Form, Detail)
│   │   │   └── ui/            # Reusable UI components (Button, Card, Badge, Input)
│   │   ├── context/           # React Context providers
│   │   │   ├── AppConfigContext.tsx   # App configuration state
│   │   │   ├── AuthContext.tsx        # Authentication state
│   │   │   ├── DealContext.tsx        # Deal management
│   │   │   ├── QueryContext.tsx       # Query management
│   │   │   ├── ThemeContext.tsx       # Theme switching
│   │   │   └── ToastContext.tsx       # Toast notifications
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useAnalytics.ts        # Analytics integration
│   │   │   └── useUmamiTracking.ts    # Umami tracking hook
│   │   ├── styles/            # CSS stylesheets
│   │   └── utils/             # Frontend utilities
│   │       ├── api.ts         # Axios API client
│   │       └── umami.ts       # Umami analytics utility
│   ├── public/                # Static assets
│   ├── webpack.config.js      # Webpack configuration
│   ├── babel.config.js        # Babel configuration
│   └── Dockerfile.frontend    # Frontend Docker build
├── config/                    # Backend configuration
│   └── db.ts                  # MongoDB connection
├── controllers/               # Request handlers
│   ├── dealController.ts      # Deal scraping and retrieval
│   ├── queryController.ts     # Query CRUD operations
│   └── userController.ts      # User authentication and config
├── middleware/                # Express middleware
│   ├── auth.ts                # JWT authentication
│   ├── demoMode.ts            # Demo mode protection
│   └── rateLimiter.ts         # Rate limiting
├── models/                    # MongoDB/Mongoose models
│   ├── Deal.ts                # Deal schema
│   ├── Query.ts               # Query schema
│   └── User.ts                # User schema
├── routes/                    # API route definitions
│   ├── dealRoutes.ts          # Deal endpoints
│   ├── queryRoutes.ts         # Query endpoints
│   └── userRoutes.ts          # User endpoints
├── scripts/                   # Utility scripts
│   ├── createAdmin.ts         # Create admin user
│   └── createDemoUser.ts      # Create demo user
├── services/                  # Background services
│   └── schedulerService.ts    # Query scheduling and execution
├── types/                     # TypeScript type definitions
│   └── index.ts               # Shared types
├── utils/                     # Backend utilities
│   └── logger.ts              # Winston logger
├── server.ts                  # Express application entry point
├── docker-compose.yml         # Docker Compose orchestration
├── Dockerfile.backend         # Backend Docker build
└── .env.example               # Environment variables template
```

## Development

### Prerequisites
- Node.js 20+ (Alpine-based for Docker)
- MongoDB 6.0+
- npm

### Local Setup

1. Install dependencies:
```bash
npm install
cd client && npm install && cd ..
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section below)
```

3. Start MongoDB (if running locally):
```bash
# Using Docker:
docker run -d -p 27017:27017 --name salesscout-mongo \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  mongo:6
```

4. Start development servers:
```bash
npm run dev
```

This runs both backend and frontend concurrently:
- Backend: `http://localhost:3311` (or configured BACKEND_PORT)
- Frontend: `http://localhost:3005` (Webpack dev server)

### Development Scripts

Root package.json:
- `npm run dev` - Start both backend and frontend in development mode (uses concurrently)
- `npm run build` - Build both TypeScript backend and React frontend
- `npm run build:backend` - Build only the backend with tsc and tsc-alias
- `npm start` - Run production server

Client package.json:
- `npm run dev` - Start Webpack dev server on port 3005
- `npm run build` - Build optimized production bundle
- `npm start` - Serve production build using serve on port 3005

## Docker Deployment

### Prerequisites

1. Create Docker network (required for docker-compose):
```bash
docker network create apps
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your production configuration
```

### Build and Run

```bash
# Build and start all services (MongoDB, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Container Architecture

MongoDB (`mongo:6`):
- Container: `sales-scout-mongo`
- Port: 27017
- Health check: mongosh ping command
- Persistent storage: Docker volume `mongo_data`

Backend (`Dockerfile.backend`):
- Container: `sales-scout-backend`
- Multi-stage build (deps → builder → runner)
- Base image: `node:20-alpine`
- Non-root user: `salesscout` (uid 1001)
- Production dependencies only
- Health check enabled

Frontend (`Dockerfile.frontend`):
- Container: `sales-scout-frontend`
- Multi-stage build with Nginx
- Base image: `nginxinc/nginx-unprivileged:alpine`
- Port: 8080 (Nginx unprivileged default)
- Health check: wget on /health endpoint
- Custom nginx configuration

### Environment Variables

Create a `.env` file with the following configuration:

```env
# ==================================
# SERVER CONFIGURATION
# ==================================
NODE_ENV=production

# ==================================
# PORT CONFIGURATION
# ==================================
BACKEND_PORT=1534
FRONTEND_PORT=1533
MONGO_PORT=27017

# ==================================
# API & CORS CONFIGURATION
# ==================================
# Backend API URL for frontend to connect to
REACT_APP_API_URL=http://localhost:1534

# Comma-separated list of allowed origins
CORS_ALLOWED_ORIGINS=http://localhost:3005,http://localhost:3000,http://localhost:1533

# ==================================
# DATABASE CONFIGURATION
# ==================================
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=<your-secure-password>
MONGO_DB_NAME=redflagdeals

# ==================================
# SECURITY CONFIGURATION
# ==================================
# REQUIRED: Generate strong secret (use: openssl rand -base64 32)
JWT_SECRET=<your-super-secret-jwt-key>

# ==================================
# FEATURE FLAGS
# ==================================
# Set to 'true' to allow new user registrations
ALLOW_REGISTRATION=false

# Set to 'true' to enable demo mode
# Demo credentials: username=demo, password=Demo1234!
DEMO_MODE=true

# ==================================
# RATE LIMITING CONFIGURATION
# ==================================
# Window duration in milliseconds (default: 900000 = 15 minutes)
RATE_LIMIT_WINDOW_MS=900000

# Max requests per window for general API endpoints
RATE_LIMIT_MAX_REQUESTS=100

# Max authentication attempts per window (login/register)
RATE_LIMIT_MAX_AUTH=5

# Max scraping requests per window
RATE_LIMIT_MAX_SCRAPE=3

# ==================================
# ADMIN USER CREATION
# ==================================
ADMIN_EMAIL=admin@salesscout.com
ADMIN_PASSWORD=<your-admin-password>
ADMIN_NAME=Admin User
```

See `.env.example` for complete configuration options.

### Admin & Demo Users

Create Admin User:
```bash
# After starting the backend container
docker exec -it sales-scout-backend npm run create-admin
```

Demo Mode:  
When `DEMO_MODE=true`, a demo user is automatically created on backend startup:
- Username: `demo`
- Password: `Demo1234!`
- Restrictions: Read-only access, cannot create/update/delete resources

## Production Build

### Building for Production

```bash
# Build both server and client
npm run build

# This runs:
# 1. tsc - Compile TypeScript backend to JavaScript
# 2. tsc-alias - Resolve path aliases in compiled code
# 3. cd client && npm run build - Build optimized React bundle with Webpack

# Output:
# - Backend: ./dist/
# - Frontend: ./client/build/
```

### Running Production Server

```bash
# Set NODE_ENV and start
NODE_ENV=production npm start

# Or directly:
node dist/server.js
```

The production build:
- Compiles TypeScript to JavaScript with path alias resolution
- Creates optimized React bundle with Webpack
- Enables code splitting and tree shaking
- Serves static frontend from Express server
- Minifies and optimizes assets

### Production Optimizations

Backend:
- TypeScript compiled to JavaScript
- Path aliases resolved with tsc-alias
- Request size limits (10kb)
- Helmet security headers with CSP
- Rate limiting middleware
- Winston logger for structured logging

Frontend:
- Webpack production mode
- React 19 with automatic batching
- Code splitting for optimal loading
- CSS extraction and minification
- Asset optimization
- Babel transpilation for browser compatibility

## Technology Stack

### Backend
- Runtime: Node.js 20 (Alpine)
- Framework: Express.js 4.x
- Language: TypeScript 5.8
- Database: MongoDB 6 with Mongoose 8.x
- Authentication: JWT (jsonwebtoken 9.x) + bcryptjs
- Web Scraping: Cheerio 1.x, Axios
- Security: Helmet, CORS, express-rate-limit, express-validator
- Logging: Winston (custom logger utility)
- Development: ts-node-dev, concurrently, tsc-alias

### Frontend
- Library: React 19
- Language: TypeScript 4.9
- Routing: React Router DOM 7.x
- Build Tool: Webpack 5 with Babel
- HTTP Client: Axios 1.8
- Analytics: Umami (optional, privacy-focused)
- Styling: CSS with component-scoped styles
- Development: Webpack Dev Server with HMR

### Infrastructure
- Containerization: Docker with multi-stage builds
- Web Server: Nginx (unprivileged) for frontend
- Orchestration: Docker Compose
- Database: MongoDB 6 with authentication
- Networking: Docker bridge network

## Project Components

### Frontend Components

Authentication:
- `Login.tsx` - User login form with JWT token handling
- `Register.tsx` - User registration form (conditional rendering based on ALLOW_REGISTRATION)
- `Profile.tsx` - User profile view

Dashboard:
- `Dashboard.tsx` - Main dashboard with overview and stats

Queries:
- `QueryList.tsx` - List all user queries
- `QueryForm.tsx` - Create/edit query form
- `QueryDetail.tsx` - Query details with matched deals

UI Components:
- `Button.tsx` - Reusable button component
- `Card.tsx` - Card container component
- `Badge.tsx` - Badge/label component
- `Input.tsx` - Form input component

Layout:
- `Header.tsx` - Navigation header with theme toggle
- `Footer.tsx` - Application footer
- `DemoBanner.tsx` - Demo mode indicator banner
- `Toast.tsx` - Toast notification system
- `ErrorBoundary.tsx` - React error boundary
- `ProtectedRoute.tsx` - Route authentication wrapper

### Context Providers

- `AuthContext` - Authentication state and user management
- `QueryContext` - Query CRUD operations and state
- `DealContext` - Deal fetching and filtering
- `ThemeContext` - Light/dark theme management
- `ToastContext` - Global toast notification system
- `AppConfigContext` - Application configuration (demo mode, registration)

### Backend Services

- `schedulerService.ts` - Query scheduling and automated execution
  - Initializes active queries on startup
  - Manages setTimeout-based job scheduling
  - Executes queries and triggers webhooks
  - Handles rescheduling based on query intervals

### Middleware

- `auth.ts` - JWT token verification and user extraction
- `demoMode.ts` - Demo mode protection (blocks write operations)
- `rateLimiter.ts` - Configurable rate limiting middleware

### Utility Scripts

- `createAdmin.ts` - Create admin user from environment variables
- `createDemoUser.ts` - Create demo user (auto-runs on startup if DEMO_MODE=true)

## Troubleshooting

### Docker Network Error
```bash
# Error: network apps declared as external, but could not be found
docker network create apps
```

### MongoDB Connection Issues
```bash
# Check MongoDB is running and healthy
docker-compose logs mongo

# Verify credentials in .env match docker-compose.yml
# Ensure MONGO_URI format: mongodb://username:password@host:port/dbname?authSource=admin
```

### Port Conflicts
```bash
# Check if ports are already in use
# Windows PowerShell:
netstat -ano | findstr :1534
netstat -ano | findstr :1533
netstat -ano | findstr :27017

# Linux/Mac:
lsof -i :1534
lsof -i :1533
lsof -i :27017

# Change ports in .env if needed
```

### Frontend Can't Connect to Backend
```bash
# Verify REACT_APP_API_URL in .env matches backend port
# Check CORS_ALLOWED_ORIGINS includes frontend URL
# Rebuild frontend after changing environment variables:
docker-compose up -d --build frontend
```

### Build Failures
```bash
# Clear Docker build cache
docker-compose build --no-cache

# Remove all containers and volumes
docker-compose down -v

# Rebuild everything
docker-compose up -d --build
```

## License

Licensed under [CC BY-NC-SA 4.0](http://creativecommons.org/licenses/by-nc-sa/4.0/)

Attribution-NonCommercial-ShareAlike 4.0 International

You are free to:
- Share — copy and redistribute the material
- Adapt — remix, transform, and build upon the material

Under the following terms:
- Attribution — You must give appropriate credit
- NonCommercial — You may not use the material for commercial purposes
- ShareAlike — If you remix or adapt, you must distribute under the same license

---

Repository: [ashwnn/SalesScout](https://github.com/ashwnn/SalesScout)  
Version: 1.0.0
