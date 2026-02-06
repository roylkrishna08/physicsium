# Deployment Security Checklist

Complete security guide for deploying Physicsium to production.

## Prerequisites

Before you begin, ensure you have:
- [x] GitHub repository with your code
- [ ] MongoDB Atlas account
- [ ] Render account (for backend)
- [ ] Vercel account (for frontend)
- [ ] Cloudinary account (for image uploads)

---

## Part 1: MongoDB Atlas Setup

### 1.1 Create Database Cluster

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new project named "Physicsium"
3. Build a new cluster (Free tier M0 is sufficient for testing)
4. Choose your preferred cloud provider and region

### 1.2 Configure Database Security

1. **Database Access**:
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Username: `physicsium-user` (or your preferred name)
   - Generate a **strong** password and save it securely
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

2. **Network Access**:
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - ⚠️ **Note**: This is required for Render. For better security, add Render's specific IP addresses after deployment
   - Click "Confirm"

3. **Get Connection String**:
   - Go to your cluster
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with `physicsium`
   - Save this for later

### 1.3 Additional Security Settings

- Enable encryption at rest (in cluster settings)
- Enable audit logs if available
- Set up automated backups
- Configure database alerts

---

## Part 2: Render Backend Deployment

### 2.1 Prepare Repository

1. Ensure `.env` is in `.gitignore`
2. Push your code to GitHub
3. Verify `render.yaml` is in the backend directory

### 2.2 Create Web Service

1. Log in to [Render](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure service:
   - **Name**: `physicsium-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or your preferred plan)

### 2.3 Set Environment Variables

In the Render dashboard, go to "Environment" and add:

```
NODE_ENV=production
PORT=5000
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<generate random 32+ character string>
CLIENT_URL=<your Vercel frontend URL>
CLOUDINARY_CLOUD_NAME=<your cloudinary cloud name>
CLOUDINARY_API_KEY=<your cloudinary api key>
CLOUDINARY_API_SECRET=<your cloudinary api secret>
```

**Generate JWT_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.4 Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Copy your backend URL (e.g., `https://physicsium-backend.onrender.com`)

### 2.5 Verify Deployment

Test your API:
```bash
curl https://your-backend-url.onrender.com/
```

Expected response: `"Physicsium API is running..."`

---

## Part 3: Vercel Frontend Deployment

### 3.1 Prepare Frontend

1. Create `.env.production` in frontend directory:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

2. Push to GitHub

### 3.2 Deploy to Vercel

1. Log in to [Vercel](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.3 Set Environment Variables

In Vercel project settings → Environment Variables:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### 3.4 Deploy

1. Click "Deploy"
2. Wait for deployment
3. Copy your frontend URL (e.g., `https://physicsium.vercel.app`)

### 3.5 Update Backend CORS

1. Go back to Render dashboard
2. Update `CLIENT_URL` environment variable to your Vercel URL:
```
CLIENT_URL=https://physicsium.vercel.app
```
3. Redeploy backend service

---

## Part 4: Cloudinary Setup

1. Log in to [Cloudinary](https://cloudinary.com)
2. Go to Dashboard
3. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret
4. Update these in Render environment variables (already done above)

---

## Part 5: Post-Deployment Security Verification

### 5.1 Test Security Headers

```bash
curl -I https://your-backend-url.onrender.com/api

# Expected headers:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: ...
```

### 5.2 Test CORS Protection

```bash
curl -H "Origin: https://malicious-site.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://your-backend-url.onrender.com/api/auth/login

# Expected: CORS error or no Access-Control-Allow-Origin header
```

### 5.3 Test Rate Limiting

```bash
# Run 6 login attempts rapidly
for i in {1..6}; do 
  curl -X POST https://your-backend-url.onrender.com/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@test.com","password":"test123"}';
done

# Expected: 6th request should return 429 Too Many Requests
```

### 5.4 Test Authentication

1. Try accessing protected route without token:
```bash
curl https://your-backend-url.onrender.com/api/auth/me

# Expected: 401 Unauthorized
```

2. Login and test with token:
```bash
# Login
TOKEN=$(curl -X POST https://your-backend-url.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"yourpassword"}' \
     | jq -r '.token')

# Access protected route
curl https://your-backend-url.onrender.com/api/auth/me \
     -H "Authorization: Bearer $TOKEN"

# Expected: Your user data
```

### 5.5 Test NoSQL Injection Protection

```bash
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":{"$gt":""},"password":{"$gt":""}}'

# Expected: 400 Bad Request (input validation error)
```

---

## Part 6: Monitoring and Maintenance

### 6.1 Set Up Monitoring

**Render**:
- Enable "Auto-Deploy" for automatic updates
- Set up email alerts for deployment failures
- Monitor logs regularly

**MongoDB Atlas**:
- Set up performance alerts
- Configure backup schedule
- Monitor connection metrics

**Vercel**:
- Enable preview deployments for testing
- Set up build notifications
- Monitor bandwidth usage

### 6.2 Regular Security Maintenance

**Weekly**:
- [ ] Review application logs for suspicious activity
- [ ] Check MongoDB Atlas metrics
- [ ] Verify backups are running

**Monthly**:
- [ ] Run `npm audit` and update vulnerable packages
- [ ] Review and rotate API keys if needed
- [ ] Check for unused user accounts
- [ ] Review rate limit violations

**Quarterly**:
- [ ] Update all dependencies
- [ ] Review security policy
- [ ] Conduct security audit
- [ ] Test disaster recovery procedures

---

## Part 7: Troubleshooting

### CORS Errors

**Problem**: Frontend can't connect to backend
**Solution**: 
1. Verify `CLIENT_URL` in Render matches your Vercel URL exactly
2. Check browser console for specific CORS error
3. Ensure no trailing slashes in URLs

### Rate Limit Issues

**Problem**: Legitimate users getting blocked
**Solution**:
1. Increase rate limits in `server.js` and `rateLimitAuth.js`
2. Consider implementing IP whitelisting for trusted sources

### Database Connection Errors

**Problem**: Backend can't connect to MongoDB
**Solution**:
1. Verify `MONGO_URI` is correct
2. Check MongoDB Atlas network access settings
3. Ensure database user has correct permissions

### File Upload Failures

**Problem**: Images not uploading
**Solution**:
1. Verify Cloudinary credentials
2. Check file size limits (500KB max)
3. Ensure file type is image/*

---

## Security Checklist Summary

Before marking deployment as complete, verify:

- [x] All environment variables are set correctly
- [x] JWT_SECRET is strong and random (32+ characters)
- [x] MongoDB Atlas IP whitelist configured
- [x] CORS restricted to production URLs only
- [x] HTTPS enforced on all services
- [x] Security headers configured (CSP, HSTS, etc.)
- [x] Rate limiting active and tested
- [x] File upload restrictions in place
- [x] Error messages don't leak sensitive info
- [x] `npm audit` shows 0 vulnerabilities
- [x] Backup strategy implemented
- [x] Monitoring configured
- [x] All passwords and secrets are strong
- [x] `.env` files not committed to git

---

## Emergency Contacts

**Security Issues**: Report to [your-email@example.com]
**MongoDB Support**: https://support.mongodb.com
**Render Support**: https://render.com/support
**Vercel Support**: https://vercel.com/support

---

**Last Updated**: February 6, 2026
