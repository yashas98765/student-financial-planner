# Deployment Guide: Render + Vercel

This guide walks you through deploying the Student Financial Planner backend on Render and frontend on Vercel.

---

## Part 1: Deploy Backend on Render

### Step 1: Set Up MongoDB Atlas (Free Tier)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a free cluster (M0 tier)
4. In **Database Access**, create a user with a strong password
5. In **Network Access**, add IP `0.0.0.0/0` (allow all)
6. Click **Connect** → Copy the connection string
   - Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>`
   - Replace `<dbname>` with `student_financial_planner`

### Step 2: Deploy Backend on Render via Blueprint

1. Go to [render.com](https://render.com)
2. Sign up with GitHub or log in
3. Click **New +** → **Blueprint**
4. Select repository: `student-financial-planner`
5. Render will auto-detect `render.yaml` and show backend service config
6. Click **Deploy**
7. Wait for build to complete
8. Once running, go to **Environment** tab and add:
   - `MONGODB_URI`: Paste your MongoDB connection string from Step 1
   - `FRONTEND_URL`: Leave as `https://your-frontend-domain.vercel.app` (update after Vercel deploy)
   - `JWT_SECRET`: Keep auto-generated value (or enter your own)

### Step 3: Verify Backend
- Wait 2-3 minutes for first startup
- Test health endpoint: `https://<your-service-name>.onrender.com/api/health`
- Should return: `{"message": "Student Financial Planner API is running!", ...}`

**Note your backend URL**: `https://<your-service-name>.onrender.com`

---

## Part 2: Deploy Frontend on Vercel

### Step 1: Configure Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub or log in
3. Click **Add New...** → **Project**
4. Select repository: `student-financial-planner`
5. **Framework Preset**: React
6. **Root Directory**: `frontend`
7. Click **Deploy**

### Step 2: Set Environment Variables

While Vercel is deploying (or after first deployment):

1. In Vercel dashboard, go to your project
2. Click **Settings** → **Environment Variables**
3. Add:
   - **Name**: `REACT_APP_API_BASE`
   - **Value**: `https://<your-render-service>.onrender.com/api`
   - (Use the backend URL from Part 1, Step 3)
4. Save and redeploy (or trigger a new deployment on main branch)

### Step 3: Verify Frontend

- Frontend will be live at: `https://student-financial-planner.vercel.app` (or custom domain)
- Test login page loads
- Try creating an account or logging in
- API calls should route to Render backend

---

## Part 3: Update Backend CORS (Optional but Recommended)

If frontend URL differs from what's in backend .env:

1. Go to Render dashboard
2. Select your backend service
3. **Environment** tab
4. Update `FRONTEND_URL` to match your exact Vercel domain:
   - e.g., `https://student-financial-planner.vercel.app`
5. Click **Save** (auto-redeploy)

This ensures CORS headers allow requests from your Vercel frontend.

---

## Troubleshooting

### Backend health check fails
- Check MongoDB URI is correct
- Verify Network Access in MongoDB Atlas includes your IP
- Check Render logs for connection errors

### Frontend API calls fail
- Ensure `REACT_APP_API_BASE` is set in Vercel env
- Verify backend CORS includes frontend URL
- Check browser console for exact error

### 502 Bad Gateway from Render
- Wait 2-3 minutes for cold start
- Check Render logs for startup errors
- Verify MongoDB connection string is valid

---

## URLs After Deployment

- **Frontend**: `https://your-frontend.vercel.app`
- **Backend API**: `https://your-backend.onrender.com/api`
- **Health Check**: `https://your-backend.onrender.com/api/health`

---

## Next Steps

- Enable custom domains on Vercel/Render (optional)
- Set up GitHub Actions CI/CD for auto-deploy on push
- Configure email/SMS notifications (Twilio setup in backend .env)
- Monitor API usage and logs on both platforms
