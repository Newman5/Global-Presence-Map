# GitHub Pages Deployment Guide

## Overview

This project is configured to automatically deploy to GitHub Pages whenever changes are pushed to the `main` branch. The deployed site will display the interactive globe with all members from `public/data/members.json`.

## How to Update the Globe

### Method 1: Edit Directly on GitHub (Easiest)

1. Navigate to `public/data/members.json` on GitHub
2. Click the pencil icon to edit
3. Make your changes (add/remove/update members)
4. Commit the changes to the `main` branch
5. GitHub Actions will automatically build and deploy the updated globe
6. Wait ~2-3 minutes for the deployment to complete
7. Visit your GitHub Pages URL to see the changes

### Method 2: Local Update and Push

1. Clone the repository (if not already cloned):
   ```bash
   git clone https://github.com/Newman5/Global-Presence-Map.git
   cd Global-Presence-Map
   ```

2. Edit `public/data/members.json`:
   - Add new members with their name, city, latitude, and longitude
   - Remove members as needed
   - Update existing member information

3. Commit and push:
   ```bash
   git add public/data/members.json
   git commit -m "Update member locations"
   git push origin main
   ```

4. GitHub Actions will automatically deploy the changes

## Member Data Format

Each member in `public/data/members.json` should follow this format:

```json
{
  "name": "Member Name",
  "city": "City Name",
  "lat": 40.7128,
  "lng": -74.0060
}
```

- `name`: Display name or initials for privacy
- `city`: City name for display
- `lat`: Latitude (number or null)
- `lng`: Longitude (number or null)

## Testing Locally Before Deployment

To preview your changes before pushing:

```bash
npm install
npm run build
npm run start
```

Then open `http://localhost:3000` in your browser.

## GitHub Pages Setup (First Time Only)

1. Go to your repository on GitHub
2. Click on **Settings** → **Pages**
3. Under **Build and deployment**:
   - Source: Select **GitHub Actions**
4. Save the settings

The workflow will automatically deploy on the next push to `main`.

## Deployment URL

After deployment, your globe will be available at:
```
https://[your-username].github.io/Global-Presence-Map/
```

Replace `[your-username]` with your GitHub username.

## Troubleshooting

### Deployment Failed

- Check the **Actions** tab on GitHub to see the workflow logs
- Ensure `public/data/members.json` is valid JSON
- Verify that GitHub Pages is enabled in repository settings

### Changes Not Showing

- Wait a few minutes for GitHub's CDN to update
- Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check that the workflow completed successfully in the Actions tab

### Build Errors

- Ensure all members have valid latitude/longitude values or `null`
- Check that the JSON syntax is correct (no trailing commas, proper quotes)

## Manual Workflow Trigger

You can manually trigger a deployment:

1. Go to **Actions** tab on GitHub
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow** button
4. Select the `main` branch
5. Click **Run workflow**
