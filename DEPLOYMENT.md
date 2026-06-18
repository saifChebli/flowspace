# Flowspace Platform - VPS Deployment Guide

This guide provides step-by-step instructions to deploy the Flowspace (Next.js client + Express.js backend) to a Linux VPS (e.g., Ubuntu 20.04/22.04/24.04).

## Prerequisites

1. A Virtual Private Server (VPS) running Ubuntu.
2. A Domain name mapped to your VPS's IP address (e.g., `flowspace.yourdomain.com`).
3. SSH access to the server with sudo privileges.
4. Database: An external PostgreSQL database (like Supabase, AWS RDS) or you can install PostgreSQL on the VPS.

---

## 1. Initial Server Setup & Dependencies

Connect to your VPS via SSH:
```bash
ssh user@your_vps_ip
```

Update your system and install essential packages:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx
```

Install Node.js (v20):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Install PM2 globally (Process Manager to keep the apps running):
```bash
sudo npm install -g pm2
```

---

## 2. Clone the Repository

Clone your project to a designated folder on the VPS (e.g., `/var/www/flowspace`):

```bash
sudo mkdir -p /var/www/flowspace
sudo chown -R $USER:$USER /var/www/flowspace
cd /var/www/flowspace

# If using git:
git clone https://github.com/yourusername/flowspace.git .
# Or copy files manually via SCP/SFTP
```

---

## 3. Server (Backend) Deployment

Setup the Express backend:

```bash
cd /var/www/flowspace/server

# Install dependencies
npm install
```

Configure the environment variables:
```bash
nano .env
```
Paste in your backend environment variables based on `.env.example`:
```env
NODE_ENV=production
PORT=5000

# Update this to your production database URL
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Generate new secure JWT secrets
JWT_ACCESS_SECRET=your_secure_access_secret_here
JWT_REFRESH_SECRET=your_secure_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Third party integrations
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_app_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# The URL of your deployed Next.js frontend
CLIENT_URL=https://flowspace.yourdomain.com
```

Build the TypeScript code and apply Prisma schema:
```bash
npm run db:generate
npm run db:push      # or npm run db:migrate if using migrations
npm run build
```

Start the backend with PM2:
```bash
pm2 start dist/server.js --name "flowspace-server"
```

---

## 4. Client (Frontend) Deployment

Setup the Next.js frontend:

```bash
cd /var/www/flowspace/client

# Install dependencies
npm install
```

Configure the environment variables:
```bash
nano .env.local
```
Add the production API URL:
```env
NEXT_PUBLIC_API_URL=https://flowspace.yourdomain.com/api
NEXT_PUBLIC_SOCKET_URL=https://flowspace.yourdomain.com
```

Build and Start the Next.js app:
```bash
npm run build
pm2 start npm --name "flowspace-client" -- run start
```

Save the PM2 process list so they start on reboot:
```bash
pm2 save
pm2 startup
# Follow the command PM2 prints out to enable systemd daemon
```

---

## 5. Nginx Reverse Proxy Configuration

Nginx will route traffic from ports 80/443 to your Nex.js app (Port 3000) and Express API (Port 5000).

Create a new Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/flowspace
```

Paste the following configuration:
```nginx
server {
    listen 80;
    server_name flowspace.yourdomain.com; # Replace with your domain

    # Route /api and /socket.io requests to the Express backend (Port 5000)
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Route all other traffic to the Next.js frontend (Port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/flowspace /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. SSL Certificate (HTTPS)

Secure your application with Let's Encrypt:

```bash
sudo certbot --nginx -d flowspace.yourdomain.com
```
Follow the prompts (enter your email, agree to terms, and select to redirect HTTP to HTTPS).

---

## 7. Verification

1. Go to `https://flowspace.yourdomain.com` and ensure the client loads.
2. Try viewing workspaces and checking if the API responses are successful. 
3. Perform a real-time action (like moving a kanban card or receiving a chat message) to ensure WebSocket/Socket.io connections are successfully proxied.

### Common PM2 Commands for Maintenance:
* `pm2 status` - View running apps
* `pm2 logs` - View logs for all apps
* `pm2 restart all` - Restart both client and server (do this after deploying updates)
* `pm2 reload flowspace-server` - Reload backend with zero downtime
