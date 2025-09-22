# Complete Deployment Guide for LPRT Property Management System

## Quick Deployment

### Option 1: Automated Setup (Recommended)
1. **Run setup script**: Double-click `deploy-setup.bat` (Windows)
2. **Push to GitHub**: Create repository and push all code
3. **Deploy Backend**: Connect GitHub repo to Render
4. **Deploy Frontend**: Connect GitHub repo to Vercel
5. **Update URLs**: Set environment variables in both platforms

### Option 2: Manual Deployment
Follow the detailed steps below.

## Issues Fixed

### 1. Environment Variable Mismatch
- **Problem**: Frontend was using `VITE_API_URL` but example showed `REACT_APP_API_URL`
- **Solution**: Updated all environment files to use `VITE_` prefix for Vite compatibility

### 2. Missing Production Environment Configuration
- **Problem**: No production environment file with correct backend URL
- **Solution**: Created `.env.production` with production API URL

### 3. CORS Configuration Issue
- **Problem**: Backend CORS had trailing slash in Vercel URL
- **Solution**: Removed trailing slash and added multiple domain variations

## Deployment Steps

### Backend (Render)
1. Make sure your Render backend URL is correct
2. Update the CORS origins in `Backend/server.js` with your exact Vercel URL
3. Redeploy backend on Render

### Frontend (Vercel)
1. **IMPORTANT**: Update `.env.production` with your actual Render backend URL:
   ```
   VITE_API_URL=https://YOUR-ACTUAL-BACKEND-URL.onrender.com/api
   ```

2. In Vercel dashboard, go to your project settings → Environment Variables
3. Add the environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://YOUR-ACTUAL-BACKEND-URL.onrender.com/api`
   - Environment: Production

4. Redeploy your frontend

### Verification Steps
1. Check browser console for errors
2. Test the `/api/health` endpoint: `https://YOUR-BACKEND-URL.onrender.com/api/health`
3. Verify CORS headers in browser network tab

## Common Issues

### "Failed to load resource: net::ERR_CONNECTION_REFUSED"
- This means frontend is still trying to connect to localhost
- Verify environment variables are set correctly in Vercel
- Check that `VITE_API_URL` is used (not `REACT_APP_API_URL`)

### CORS Errors
- Update backend CORS configuration with exact frontend URL
- Remove trailing slashes from URLs
- Ensure `credentials: true` is set

### Environment Variables Not Loading
- Vite requires `VITE_` prefix for environment variables
- Verify variables are set in Vercel dashboard
- Redeploy after adding environment variables
