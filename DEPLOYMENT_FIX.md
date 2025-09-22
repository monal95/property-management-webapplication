# 🚨 DEPLOYMENT FIX GUIDE - Rentify Backend Connection Issue

## PROBLEM IDENTIFIED
Your frontend is trying to connect to `localhost:5000` instead of your deployed backend.

## SOLUTION STEPS

### 1. ✅ FIXED: Frontend Environment Variable
Updated `.env.production` to use correct backend URL: `https://rentify-api.onrender.com/api`

### 2. 🔧 BACKEND ISSUES TO CHECK

#### A. Verify Backend Health Endpoint
Test your backend: https://rentify-api.onrender.com/api/health

#### B. Check Render Deployment Settings
1. **Root Directory**: Should be set to `Backend` (not root)
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. **Environment Variables** (must be set in Render dashboard):
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://monalprashanth99_db_user:Monal%401234@rentify.bf4u4qt.mongodb.net/?retryWrites=true&w=majority&appName=rentify
   JWT_SECRET=lprt_super_secure_jwt_secret_key_2024_production_ready_long_string
   RAZORPAY_KEY_ID=rzp_test_RCHaOhp52EsElD
   RAZORPAY_KEY_SECRET=2fkYb1q3zkKdLjONGyIRpaGA
   FRONTEND_URL=https://rentify-rho.vercel.app
   ```

### 3. 🔧 FRONTEND VERCEL SETTINGS
1. **Root Directory**: Should be set to `frontend`
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variables** (must be set in Vercel dashboard):
   ```
   VITE_API_URL=https://rentify-api.onrender.com/api
   ```

### 4. 🚀 IMMEDIATE ACTIONS NEEDED

#### Step 1: Update Vercel Environment Variable
1. Go to https://vercel.com/dashboard
2. Select your `rentify-rho` project
3. Go to Settings → Environment Variables
4. Add or update:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://rentify-api.onrender.com/api`
   - **Environment**: Production
5. Redeploy your frontend

#### Step 2: Check Render Backend
1. Go to https://dashboard.render.com
2. Select your backend service
3. Check if it's running (should show "Live" status)
4. Verify environment variables are set
5. Check logs for any errors

#### Step 3: Test Backend Directly
Visit: https://rentify-api.onrender.com/api/health
Should return: `{"status":"OK","message":"LPRT Server is running"}`

### 5. 🔍 DEBUGGING STEPS

If backend still not working:

1. **Check Render Logs**:
   - Go to your Render service
   - Click "Logs" tab
   - Look for errors

2. **Common Issues**:
   - MongoDB connection timeout
   - Missing environment variables
   - Wrong root directory in Render
   - Port configuration issues

3. **Quick Test**:
   ```bash
   # Test if backend is accessible
   https://rentify-api.onrender.com/api/health
   
   # Should return JSON response, not 404
   ```

### 6. 📝 UPDATED FILES CREATED
- ✅ Fixed `frontend/.env.production`
- ✅ Updated CORS configuration in `Backend/server.js`
- ✅ Enhanced API configuration in `frontend/src/api.js`

## NEXT STEPS
1. Push these changes to GitHub
2. Update Vercel environment variable
3. Redeploy both frontend and backend
4. Test the connection

The main issue was the frontend environment variable pointing to localhost instead of your deployed backend!