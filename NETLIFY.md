# Connecting ViewPoint to Netlify

Your project is fully configured and ready for deployment on **Netlify** with full-stack support (Vite React frontend + Netlify Serverless Functions for Express API).

---

## Architecture Overview on Netlify

- **Frontend:** Built into `dist/` and served globally through Netlify's high-speed CDN.
- **Backend API:** Powered by Netlify Functions (`netlify/functions/api.ts`) using `serverless-http` to execute your Express API routes (`/api/*`).
- **Routing:** Handled automatically via `netlify.toml` and `public/_redirects`:
  - `/api/*` requests route to `/.netlify/functions/api/*`
  - All other routes (`/*`) fallback to `/index.html` for client-side React Router navigation.

---

## Option 1: Deploy via GitHub (Recommended for Continuous Deployment)

1. **Push your code to GitHub:**
   - In Google AI Studio, click the **Export to GitHub** or download the ZIP from the top-right settings menu.
   - Commit and push the repository to your GitHub account.

2. **Connect to Netlify:**
   - Go to [Netlify Dashboard](https://app.netlify.com/).
   - Click **Add new site** > **Import an existing project**.
   - Select **GitHub** and authorize Netlify.
   - Choose your repository.

3. **Verify Build Settings:**
   Netlify will automatically detect settings from your `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`

4. **Add Environment Variables (Netlify Site Settings > Environment Variables):**
   - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key for AI features.
   - `MONGODB_URI`: *(Optional)* Your MongoDB Atlas connection string. If omitted, ViewPoint uses Cloud Firestore.
   - `JWT_SECRET`: *(Optional)* Custom secret string for auth tokens.

5. **Deploy:** Click **Deploy Site**. Netlify will automatically build and publish your app.

---

## Option 2: Deploy via Netlify CLI

You can also deploy directly using the Netlify CLI:

```bash
# 1. Install or run Netlify CLI
npx netlify-cli login

# 2. Link or initialize site
npx netlify-cli init

# 3. Build and deploy to production
npm run build
npx netlify-cli deploy --prod
```

---

## Option 3: Manual Deploy (Netlify Drop)

1. Run the local production build:
   ```bash
   npm run build
   ```
2. Navigate to [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag and drop the `dist` folder directly onto the page for an instant static preview.
