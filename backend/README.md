## SEO Agent Backend

### Environment Variables

Create a `.env.local` (or export variables in your shell) with:

```bash
# Required
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional (with defaults)
PORT=4000
NODE_ENV=production
OPENAI_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=dall-e-2
FRONTEND_URL=http://localhost:5173
SEMANTICS_SERVICE_URL=http://localhost:4200
IMAGES_SERVICE_URL=http://localhost:4300
WEBSITE_PAGES_SERVICE_URL=http://localhost:4400
IMAGE_PROVIDER=openai

# WordPress Integration (Optional)
WORDPRESS_BASE_URL=https://your-wordpress-site.com
WORDPRESS_USERNAME=your-username
WORDPRESS_APP_PASSWORD=your-app-password
```

### Scripts

- `npm run dev` — run development server with auto-reload
- `npm run build` — compile TypeScript
- `npm start` — run compiled JavaScript

### Model selection

`OPENAI_MODEL` sets the default model. You can override per request by passing `model` in the JSON body of `POST /api/seo/generate-ideas`.

Example request body:

```json
{
	"projectId": "<project-id>",
	"hypothesisId": "<hypothesis-id>",
	"userId": "<user-id>",
	"category": "PAIN",
	"count": 3,
	"model": "gpt-5"
}
```

If the requested model errors (e.g. not found), the server falls back automatically to the default `OPENAI_MODEL`.

## 🚀 Deployment on Render

### Prerequisites

1. Render account (sign up at https://render.com)
2. MongoDB database (can be MongoDB Atlas or Render's MongoDB service)
3. OpenAI API key

### Step 1: Connect Repository

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub/GitLab repository
3. Select the `backend` directory as the root directory

### Step 2: Configure Build Settings

Render will automatically detect the `render.yaml` file. If not, use these settings:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: `Node`

### Step 3: Set Environment Variables

In Render Dashboard → Environment, add these variables:

**Required:**
- `MONGODB_URI` - Your MongoDB connection string
- `OPENAI_API_KEY` - Your OpenAI API key
- `FRONTEND_URL` - Your frontend URL (for CORS), e.g., `https://your-frontend.onrender.com`

**Optional (with defaults):**
- `NODE_ENV` = `production`
- `PORT` - Will be set automatically by Render
- `OPENAI_MODEL` = `gpt-4o-mini`
- `OPENAI_IMAGE_MODEL` = `dall-e-2`
- `SEMANTICS_SERVICE_URL` - If you have a semantics service
- `IMAGES_SERVICE_URL` - If you have an images service
- `WEBSITE_PAGES_SERVICE_URL` - If you have a website pages service
- `IMAGE_PROVIDER` = `openai`
- `WORDPRESS_BASE_URL` - If using WordPress integration
- `WORDPRESS_USERNAME` - WordPress username
- `WORDPRESS_APP_PASSWORD` - WordPress app password

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will build and deploy your service
3. Wait for the build to complete (check logs for any errors)
4. Your service will be available at `https://your-service-name.onrender.com`

### Step 5: Verify Deployment

1. Check health endpoint: `https://your-service-name.onrender.com/`
2. Test GraphQL endpoint: `https://your-service-name.onrender.com/graphql`
3. Check logs in Render Dashboard for any errors

### Troubleshooting

- **Build fails**: Check that all dependencies are in `package.json` and `package-lock.json` is committed
- **Service won't start**: Check environment variables are set correctly, especially `MONGODB_URI`
- **CORS errors**: Make sure `FRONTEND_URL` is set correctly
- **MongoDB connection errors**: Verify `MONGODB_URI` is correct and MongoDB allows connections from Render's IPs

