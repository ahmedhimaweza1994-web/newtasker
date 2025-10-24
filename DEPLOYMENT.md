# Deployment Guide for GWT Task Management System

## Production Deployment on cPanel/VPS with Apache

### Prerequisites
- Node.js 18+ installed
- PM2 for process management
- Apache web server with mod_proxy enabled
- PostgreSQL database
- SSL certificate (Let's Encrypt recommended)

---

## Step 1: Build the Application

```bash
# Install dependencies
npm install

# Build the production bundle
npm run build
```

This creates:
- `dist/` - Backend compiled code
- `dist/public/` - Frontend static files
- `public/service-worker.js` - Service worker (must be copied)

---

## Step 2: Environment Configuration

Create a `.env` file in your production directory:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/gwt_tasks
SESSION_SECRET=your-super-secure-random-secret-key
ALLOWED_ORIGINS=https://hub.greenweb-tech.com,https://www.hub.greenweb-tech.com
```

**Important:** 
- Change `SESSION_SECRET` to a strong random string
- Update `DATABASE_URL` with your actual database credentials
- Set `ALLOWED_ORIGINS` to your production domain(s)

---

## Step 3: Copy Service Worker to Build Output

The service worker must be in the root of your public directory:

```bash
# After building, copy service worker
cp public/service-worker.js dist/public/service-worker.js
```

---

## Step 4: Start with PM2

```bash
# Start the application
pm2 start npm --name "gwt-tasks" -- run start

# Save PM2 configuration
pm2 save

# Enable PM2 startup on boot
pm2 startup
```

To check logs:
```bash
pm2 logs gwt-tasks
pm2 status
```

---

## Step 5: Apache Proxy Configuration

Edit your Apache virtual host configuration:
`/var/cpanel/userdata/greenwebtech/hub.greenweb-tech.com`

Add these directives:

```apache
# Enable required modules
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so

<VirtualHost *:443>
    ServerName hub.greenweb-tech.com
    
    # SSL Configuration (managed by cPanel/Let's Encrypt)
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    # WebSocket Support for Socket.IO
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/socket.io/(.*) ws://127.0.0.1:3001/socket.io/$1 [P,L]
    
    # Proxy Socket.IO HTTP polling fallback
    ProxyPass /socket.io/ http://127.0.0.1:3001/socket.io/
    ProxyPassReverse /socket.io/ http://127.0.0.1:3001/socket.io/
    
    # Proxy all other requests
    ProxyPass / http://127.0.0.1:3001/
    ProxyPassReverse / http://127.0.0.1:3001/
    
    # Preserve headers
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"
</VirtualHost>
```

---

## Step 6: Rebuild Apache Configuration

```bash
# Rebuild Apache configuration
/scripts/rebuildhttpdconf

# Reload Apache
systemctl reload httpd
```

---

## Step 7: Database Migration

Push your schema to the production database:

```bash
# Make sure DATABASE_URL is set in .env
npm run db:push
```

---

## Troubleshooting

### WebSocket Connection Failed

1. **Check PM2 is running:**
   ```bash
   pm2 status
   pm2 logs gwt-tasks
   ```

2. **Verify port 3001 is listening:**
   ```bash
   netstat -tlnp | grep 3001
   ```

3. **Check Apache proxy modules:**
   ```bash
   httpd -M | grep proxy
   ```
   Should show: `proxy_module`, `proxy_http_module`, `proxy_wstunnel_module`

4. **Test Socket.IO locally:**
   ```bash
   curl http://localhost:3001/socket.io/
   # Should return: {"code":0,"message":"Transport unknown"}
   ```

### Service Worker 404 Error

1. **Verify file exists:**
   ```bash
   ls -la dist/public/service-worker.js
   ```

2. **If missing, copy it:**
   ```bash
   cp public/service-worker.js dist/public/service-worker.js
   pm2 restart gwt-tasks
   ```

### CORS Errors

1. **Check ALLOWED_ORIGINS in .env:**
   ```env
   ALLOWED_ORIGINS=https://hub.greenweb-tech.com
   ```

2. **Restart PM2:**
   ```bash
   pm2 restart gwt-tasks
   ```

---

## Build Script Enhancement

Add this to your `package.json` scripts to automate the build process:

```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "postbuild": "cp public/service-worker.js dist/public/service-worker.js",
    "start": "NODE_ENV=production node --require dotenv/config dist/index.js"
  }
}
```

This ensures the service worker is always copied after building.

---

## Production Checklist

- [ ] Environment variables configured in `.env`
- [ ] Database connection working
- [ ] Application builds successfully
- [ ] Service worker copied to `dist/public/`
- [ ] PM2 running the application
- [ ] Apache proxy configured correctly
- [ ] SSL certificate valid
- [ ] WebSocket connections working
- [ ] Browser notifications working
- [ ] All API endpoints responding

---

## Monitoring

```bash
# View real-time logs
pm2 logs gwt-tasks --lines 100

# Monitor resources
pm2 monit

# Check application uptime
pm2 status
```

---

## Security Recommendations

1. **Use strong SESSION_SECRET** (32+ random characters)
2. **Enable firewall** to only allow ports 80, 443, and SSH
3. **Regular updates:** `npm update` and system updates
4. **Database backups:** Schedule regular PostgreSQL backups
5. **Monitor logs:** Check PM2 and Apache logs regularly
6. **Rate limiting:** Consider adding rate limiting middleware for API endpoints

---

For questions or issues, check the logs first:
- **PM2 logs:** `pm2 logs gwt-tasks`
- **Apache logs:** `/var/log/httpd/error_log`
- **Application logs:** Check PM2 output
