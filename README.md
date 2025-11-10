# SalesScout

A full-stack TypeScript application for tracking and monitoring deals from online forums. Automatically scrapes deal listings, allows users to create custom queries, and notifies when matching deals are found.

## Architecture

**Backend**: Express.js with TypeScript, MongoDB for data persistence, JWT authentication, automated scheduling service for periodic scraping.

**Frontend**: React with TypeScript, React Router for navigation, context-based state management.

**Infrastructure**: Docker containerization with MongoDB service, Webpack build pipeline with filesystem caching.

## Features

- User authentication and authorization with JWT
- Automated deal scraping from forums using Cheerio
- Custom query creation with keyword matching
- Webhook notifications for matched deals
- Rate limiting on authentication and API endpoints
- Demo mode with read-only access
- Security middleware (Helmet, CORS, request size limits)
- Scheduled background jobs for deal updates
- Privacy-focused analytics with Umami (optional, configurable via `.env`)

## API Routes

### Users (`/api/users`)
- `GET /config` - Application configuration (public)
- `POST /register` - User registration (rate limited)
- `POST /login` - User authentication (rate limited)
- `GET /profile` - Get user profile (protected)

### Deals (`/api/deals`)
- `GET /` - Retrieve all deals with pagination and filtering
- `GET /scrape` - Manually trigger deal scraping (protected, strict rate limit)

### Queries (`/api/queries`)
- `POST /` - Create new query (protected)
- `GET /` - Get user's queries (protected)
- `GET /:id` - Get query details and matched deals (protected)
- `PUT /:id` - Update query (protected)
- `DELETE /:id` - Delete query (protected)

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # Context providers
│   │   ├── styles/         # CSS stylesheets
│   │   └── utils/          # API client utilities
│   └── webpack.config.js   # Webpack configuration
├── config/                 # Database configuration
├── controllers/            # Request handlers
├── middleware/             # Express middleware
├── models/                 # MongoDB models
├── routes/                 # API route definitions
├── services/               # Background services
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
└── server.ts               # Application entry point
```

## Development

### Prerequisites
- Node.js 18+
- MongoDB 7.0+
- npm

### Local Setup

1. Install dependencies:
```bash
npm install
cd client && npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start development server:
```bash
npm run dev
```

Application runs on `http://localhost:3311` (backend) and `http://localhost:3005` (frontend dev server).

## Docker Deployment

### Build and Run

```bash
docker-compose up -d
```

### Environment Variables

Create a `.env` file with the following required variables:

```env
NODE_ENV=production
PORT=3311
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=<your-password>
MONGO_DB_NAME=redflagdeals
JWT_SECRET=<your-secret>
FRONTEND_URL=http://localhost:3311
ALLOW_REGISTRATION=false
DEMO_MODE=true
```

See `.env.example` for complete configuration options.

### Analytics Setup (Optional)

SalesScout includes Umami analytics for tracking user behavior and application performance. To enable:

1. Add Umami configuration to your `.env` file (see `.env.example` for all options)
2. Set `REACT_APP_UMAMI_ENABLED=true`
3. Configure your Umami script URL and website ID

See [UMAMI_QUICKSTART.md](./UMAMI_QUICKSTART.md) for detailed setup instructions, or [UMAMI_ANALYTICS.md](./UMAMI_ANALYTICS.md) for complete documentation.

### Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose up -d --build
```

## Production Build

```bash
# Build both server and client
npm run build

# Start production server
npm start
```

The production build compiles TypeScript to JavaScript, optimizes the React bundle with code splitting, and serves the static frontend from the Express server.

## Scripts

**Root package.json:**
- `npm run dev` - Start development server (both backend and frontend)
- `npm run build` - Build production bundles
- `npm start` - Run production server

**Client package.json:**
- `npm run dev` - Start webpack dev server
- `npm run build` - Build optimized production bundle
- `npm start` - Serve production build

## License

Licensed under [CC BY-NC-SA 4.0](http://creativecommons.org/licenses/by-nc-sa/4.0/)