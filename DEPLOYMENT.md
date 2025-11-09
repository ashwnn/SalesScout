# Deployment Guide

## Pre-Deployment Checklist

Before deploying SalesScout to production, ensure you complete the following steps:

### 1. Environment Configuration

Create a `.env` file with production settings:

```bash
# Database
MONGO_URI=your-production-mongodb-uri

# Server
PORT=3000
NODE_ENV=production

# Security - CHANGE THESE!
JWT_SECRET=generate-a-strong-random-secret-here

# Feature Flags
ALLOW_REGISTRATION=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate a strong JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Create Admin User

Before disabling registration, create your admin account:

```bash
npm run create-admin yourusername your@email.com YourSecurePassword123
```

### 3. Build the Application

```bash
npm run build:all
```

This will:
- Compile TypeScript backend to JavaScript
- Build React frontend for production
- Optimize assets

### 4. Set Up MongoDB

**Option A: MongoDB Atlas (Recommended)**
1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Whitelist your server IP
3. Create a database user
4. Copy the connection string to `MONGO_URI`

**Option B: Self-Hosted MongoDB**
1. Install MongoDB on your server
2. Enable authentication
3. Create a database and user
4. Update `MONGO_URI` accordingly

### 5. Security Hardening

#### Set ALLOW_REGISTRATION=false
```bash
ALLOW_REGISTRATION=false
```

#### Enable HTTPS
- Use a reverse proxy (nginx, Apache)
- Install SSL certificate (Let's Encrypt recommended)
- Redirect HTTP to HTTPS

#### Configure CORS
Edit `server.ts` to allow only your domain:
```typescript
const corsOptions = {
  origin: 'https://yourdomain.com',
  credentials: true
};
app.use(cors(corsOptions));
```

#### Add Security Headers (Optional but Recommended)
Install helmet:
```bash
npm install helmet
```

Add to `server.ts`:
```typescript
import helmet from 'helmet';
app.use(helmet());
```

### 6. Process Management

Use PM2 to keep the application running:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start dist/server.js --name salesscout

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup
```

### 7. Reverse Proxy Setup (nginx example)

Create nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Serve static frontend files
    location / {
        root /path/to/SalesScout/client/build;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 8. Environment Variables on Server

Set environment variables on your server:

**Using systemd:**
Create `/etc/systemd/system/salesscout.service`:
```ini
[Unit]
Description=SalesScout Application
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/SalesScout
Environment=NODE_ENV=production
Environment=MONGO_URI=your-mongodb-uri
Environment=JWT_SECRET=your-jwt-secret
Environment=ALLOW_REGISTRATION=false
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

**Or using PM2 ecosystem file:**
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'salesscout',
    script: './dist/server.js',
    env: {
      NODE_ENV: 'production',
      MONGO_URI: 'your-mongodb-uri',
      JWT_SECRET: 'your-jwt-secret',
      ALLOW_REGISTRATION: 'false',
      PORT: 3000
    }
  }]
};
```

Then start with:
```bash
pm2 start ecosystem.config.js
```

### 9. Monitoring & Logging

**Using PM2:**
```bash
# View logs
pm2 logs salesscout

# Monitor resources
pm2 monit

# View status
pm2 status
```

**Log Rotation:**
```bash
pm2 install pm2-logrotate
```

### 10. Backup Strategy

Set up regular MongoDB backups:

```bash
# Create backup script
#!/bin/bash
mongodump --uri="$MONGO_URI" --out=/path/to/backups/$(date +%Y%m%d)

# Add to crontab for daily backups at 2 AM
0 2 * * * /path/to/backup-script.sh
```

## Platform-Specific Deployment

### Deploy to VPS (DigitalOcean, Linode, AWS EC2, etc.)

1. SSH into your server
2. Install Node.js (v18+), MongoDB, nginx
3. Clone repository
4. Follow steps 1-10 above
5. Configure firewall (allow ports 80, 443, 22)

### Deploy to Heroku

```bash
# Install Heroku CLI
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set ALLOW_REGISTRATION=false
heroku config:set MONGO_URI=your-mongodb-uri

# Deploy
git push heroku main
```

### Deploy to Railway.app

1. Connect GitHub repository
2. Set environment variables in Railway dashboard
3. Railway will auto-detect and build the app

### Deploy to Render.com

1. Connect GitHub repository
2. Set build command: `npm run build:all`
3. Set start command: `npm run start:prod`
4. Add environment variables
5. Deploy

## Post-Deployment

### Verify Deployment

1. **Test registration is disabled:**
   ```bash
   curl -X POST https://yourdomain.com/api/users/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","email":"test@test.com","password":"test123"}'
   ```
   Should return: `"Registration is currently disabled"`

2. **Test login works:**
   ```bash
   curl -X POST https://yourdomain.com/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"username":"youradmin","password":"yourpassword"}'
   ```
   Should return a JWT token

3. **Test rate limiting:**
   Make multiple rapid requests and verify 429 response

4. **Check HTTPS:**
   Visit your site and verify the padlock icon

### Monitor

- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor error logs daily
- Check MongoDB Atlas metrics (if using Atlas)
- Review PM2 logs regularly

## Troubleshooting

**Application won't start:**
- Check MongoDB connection
- Verify all environment variables are set
- Check port availability
- Review error logs

**Can't create admin user:**
- Verify MongoDB is running
- Check MONGO_URI is correct
- Ensure user doesn't already exist

**Rate limiting too aggressive:**
- Adjust `RATE_LIMIT_MAX_REQUESTS` in .env
- Increase `RATE_LIMIT_WINDOW_MS`

**CORS errors:**
- Update CORS configuration in server.ts
- Ensure frontend and backend domains match

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review logs for error messages
3. Verify environment configuration
4. Create a new GitHub issue with details
