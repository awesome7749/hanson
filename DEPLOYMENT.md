# Deployment Guide for Google App Engine

## Prerequisites

1. Google Cloud account with billing enabled
2. `gcloud` CLI installed and configured
3. Your domain `hansonhome.us` on Namecheap

## Step 1: Build the React App

```bash
cd my-app
npm run build
```

This creates the production build in `my-app/build/`.

## Step 2: Configure Google Cloud

```bash
# Login to Google Cloud (if not already logged in)
gcloud auth login

# Set your project (replace YOUR_PROJECT_ID)
gcloud config set project YOUR_PROJECT_ID

# Enable App Engine (first time only)
gcloud app create --region=us-central
```

## Step 3: Update Environment Variables

Edit `app.yaml` and update the environment variables:
- `REACT_APP_HANSON_API_KEY`: Your RentCast API key
- `REACT_APP_SITE_PASSWORD`: Change default password before deploying

**IMPORTANT**: Never commit sensitive API keys to Git. Consider using Secret Manager for production.

## Step 4: Deploy

```bash
# From the project root
npm run deploy

# Or manually:
gcloud app deploy
```

The deployment will upload your app and make it live at:
- `https://YOUR_PROJECT_ID.appspot.com`

## Step 5: Custom Domain (hansonhome.us)

### In Google Cloud Console:

1. Go to **App Engine** > **Settings** > **Custom domains**
2. Click **Add a custom domain**
3. Verify domain ownership
4. Follow the instructions to get DNS records

### In Namecheap:

1. Go to your domain dashboard
2. Click **Advanced DNS**
3. Add the DNS records provided by Google Cloud:
   - **A Record**: Points to Google's IP
   - **AAAA Record**: Points to Google's IPv6
   - **CNAME Record** (for www): Points to `ghs.googlehosted.com`

**DNS propagation can take 24-48 hours.**

## Step 6: Force HTTPS (Recommended)

In `app.yaml`, all handlers already have `secure: always` which forces HTTPS.

## Managing the App

### View logs:
```bash
gcloud app logs tail -s default
```

### Check deployment status:
```bash
gcloud app browse
```

### Update app:
```bash
npm run build
gcloud app deploy
```

## Password Protection

**Current password**: `hanson2026`

To change:
1. Update `REACT_APP_SITE_PASSWORD` in `.env` (for local dev)
2. Update `env_variables` in `app.yaml` (for production)
3. Rebuild and redeploy

To remove password protection:
1. Edit `my-app/src/App.tsx`
2. Remove the `<PasswordProtection>` wrapper
3. Rebuild and redeploy

## Cost Optimization

The current `app.yaml` configuration:
- **min_instances: 0** - No instances when not in use (saves money)
- **max_instances: 2** - Limits scaling
- Static file serving is very cheap on App Engine

**Expected cost**: ~$0-5/month for low traffic (first 28 instance-hours free daily)

## Troubleshooting

### Build fails:
```bash
cd my-app
npm install
npm run build
```

### Deployment fails:
- Check `gcloud` is authenticated: `gcloud auth list`
- Verify project is set: `gcloud config get-value project`
- Check App Engine is enabled

### Site not loading:
- Check deployment status: `gcloud app versions list`
- View logs: `gcloud app logs tail -s default`

### Domain not working:
- Verify DNS records in Namecheap match Google Cloud requirements
- Wait 24-48 hours for DNS propagation
- Use `nslookup hansonhome.us` to check DNS resolution
