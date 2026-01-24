# Deployment Instructions

## ✅ COMPLETED RESTRUCTURING

The project has been successfully split into frontend and backend:

### Frontend (client/)
- **Framework**: Vite + React + Tailwind CSS
- **Location**: `/workspaces/SutharSeva-NitinParmar/client`
- **Build Command**: `npm run build`
- **Output**: `client/dist/`
- **Dependencies**: All UI libraries moved to client/package.json

### Backend (server/)
- **Framework**: Express.js API only
- **Location**: `/workspaces/SutharSeva-NitinParmar/server`
- **Dependencies**: Server-only libs in root package.json
- **Features**: Firebase Admin, Cloudinary uploads, API endpoints
- **CORS**: Enabled for frontend communication

## 🚀 NETLIFY DEPLOYMENT

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Split frontend and backend - ready for deployment"
git push origin main
```

### Step 2: Deploy to Netlify
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and select your repository
4. Netlify will auto-detect the settings from `netlify.toml`:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `dist`

### Step 3: Add Environment Variables in Netlify
Go to Site settings → Environment variables → Add:
- `VITE_API_BASE_URL` = Your backend API URL (e.g., `https://your-backend.onrender.com`)

### Step 4: Deploy
Click "Deploy site" and wait for build to complete.

### Step 5: Verify
Open your Netlify URL and verify:
- ✅ Tailwind styles are visible
- ✅ React app loads correctly
- ✅ UI components are styled properly

## 🖥️ BACKEND DEPLOYMENT (Optional)

If you need to deploy the backend separately:

### Option 1: Render.com
1. Create new Web Service
2. Connect GitHub repo
3. Set:
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment variables: Firebase, Cloudinary credentials

### Option 2: Railway.app
Similar to Render with automatic deployments.

## 🔧 LOCAL TESTING

### Frontend
```bash
cd client
npm install
npm run dev        # Development server on port 5173
npm run build      # Production build
npm run preview    # Preview production build on port 4173
```

### Backend
```bash
npm install
npm run dev        # Development server on port 5000
```

## 📝 NOTES

- Frontend and backend are now completely separate
- No Express static serving - frontend deployed to Netlify
- Backend is API-only with CORS enabled
- All fetch calls now use `apiUrl()` helper that respects `VITE_API_BASE_URL`
- Production environment variable set in `client/.env.production`
