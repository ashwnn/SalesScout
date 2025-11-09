# SalesScout

A deal tracking and monitoring application that scrapes and tracks deals from RedFlagDeals.

## Features

- 🔍 Automated deal scraping from RedFlagDeals
- 📊 Dashboard with deal analytics
- 🔔 Custom query creation and monitoring
- 🎯 Deal filtering and search
- 🔐 User authentication and authorization
- 🛡️ Rate limiting and security controls
- ⏰ Freshness indicators for deals

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SalesScout
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   cd ..
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure your settings (see [Security Configuration](SECURITY.md))

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   # Or update MONGO_URI in .env
   ```

5. **Run the application**
   ```bash
   # Development mode (runs both server and client)
   npm run dev

   # Production mode
   npm run build:all
   npm run start:prod
   ```

6. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000

## Environment Variables

Key environment variables (see `.env.example` for full list):

- `MONGO_URI` - MongoDB connection string
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens
- `ALLOW_REGISTRATION` - Enable/disable user registration (`true`/`false`)
- `RATE_LIMIT_WINDOW_MS` - Rate limiting time window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

**Important:** See [SECURITY.md](SECURITY.md) for detailed security configuration before deploying publicly.

## Security

This application includes several security features:

- ✅ Registration can be disabled via environment variable
- ✅ Rate limiting on authentication endpoints
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation

**For public deployments:** Review [SECURITY.md](SECURITY.md) for the security checklist and configuration guide.

## Project Structure

```
SalesScout/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # React context providers
│   │   ├── styles/      # CSS styles
│   │   └── utils/       # Utility functions
│   └── public/          # Static assets
├── controllers/         # Express route controllers
├── middleware/          # Express middleware
├── models/             # Mongoose models
├── routes/             # Express routes
├── services/           # Business logic services
├── types/              # TypeScript type definitions
└── server.ts           # Express server entry point
```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user (if enabled)
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (protected)

### Deals
- `GET /api/deals` - Get all deals
- `GET /api/deals/scrape` - Trigger manual deal scrape

### Queries
- `GET /api/queries` - Get all queries (protected)
- `POST /api/queries` - Create new query (protected)
- `GET /api/queries/:id` - Get specific query (protected)
- `PUT /api/queries/:id` - Update query (protected)
- `DELETE /api/queries/:id` - Delete query (protected)

## Technologies Used

**Backend:**
- Node.js & Express
- MongoDB & Mongoose
- TypeScript
- JWT for authentication
- Cheerio for web scraping
- Axios for HTTP requests

**Frontend:**
- React with TypeScript
- React Router for navigation
- Context API for state management
- CSS for styling

## Scripts

```bash
npm run dev          # Run development server (both frontend and backend)
npm run server       # Run backend only
npm run client       # Run frontend only
npm run build        # Build backend
npm run build:client # Build frontend
npm run build:all    # Build both
npm run start        # Start production server
```

## License

See [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
