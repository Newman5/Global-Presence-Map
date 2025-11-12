# 🌍 Global Presence Map — Live URL Deployment Guide

## 🎯 Goal
Enable anyone to view an exported 3D globe via a **secure public URL**, without requiring them to download `.html` files.

Example target URL:
```
https://newman5.github.com/global-presence-map/meetings/meeting-2025-11-12-abc123
```

---

## 🧩 Overview
The Global Presence Map visualizes community participation on an interactive 3D globe. Each meeting can be exported as a static `.html` file containing all necessary scripts and data.

The goal of this guide is to host these meeting exports online using **GitHub Pages**, so that each file automatically becomes viewable at a public HTTPS URL.

---

## 🪜 Steps

### 1. Create or Confirm Repository
1. Log into GitHub and create (or confirm) this repo:
   ```
   https://github.com/Newman5/Global-Presence-Map
   ```
   > The special `.github.io` name automatically enables GitHub Pages hosting at https://newman5.github.io/Global-Presence-Map/

2. Clone it locally:
   ```bash
   git clone https://github.com/Newman5/Global-Presence-Map.git
   
   ```

3. Set up the basic folder structure:
   ```
   /public
     meeting-today.html
   ```


---

### 2. Enable GitHub Pages
1. Go to the repository on GitHub → **Settings → Pages**.
2. Under **Build and deployment**:
   - Source: `Deploy from branch`
   - Branch: `main`
   - Folder: `/ (root)`
3. Save changes — GitHub will issue a live HTTPS link automatically.

✅ Result:
```
https://newman5.github.io/Global-Presence-Map/public/meeting-today.html
```

---

### 3. Deploy New Meeting Pages
When a new meeting globe is exported (for example, `meeting-2025-11-12-abc123.html`), copy it into the `/meetings` folder and push it to GitHub:

```bash
cp /path/to/exported/meeting-2025-11-12-abc123.html ./meetings/
git add meetings/meeting-2025-11-12-abc123.html
git commit -m "Add meeting 2025-11-12-abc123"
git push
```

GitHub Pages will automatically deploy within 30–60 seconds.

✅ Result:
```
https://globalpresencemap.github.io/meetings/meeting-2025-11-12-abc123.html
```

---

### 4. Configure Custom Domain (Optional)
If you own `globalpresencemap.com`, you can point it to GitHub Pages:

1. In **GitHub → Settings → Pages → Custom domain**, enter:
   ```
   globalpresencemap.com
   ```
2. In your DNS provider (e.g., Cloudflare), create a **CNAME** record:
   ```
   CNAME  globalpresencemap.com  globalpresencemap.github.io
   ```
3. Save and wait for propagation. GitHub will automatically create an HTTPS certificate.

✅ Now accessible at:
```
https://globalpresencemap.com/meetings/meeting-2025-11-12-abc123
```

---

### 5. Optional Automation Script
For convenience, create a bash script (e.g. `publish-meeting.sh`):

```bash
#!/bin/bash
# Usage: ./publish-meeting.sh path/to/meeting.html

file=$1
basename=$(basename $file)
cp "$file" ./meetings/
git add "meetings/$basename"
git commit -m "Add $basename"
git push
```

Then publish new meetings with:
```bash
./publish-meeting.sh ~/exports/meeting-2025-11-12-abc123.html
```

---

## 🔐 Why This Works
- **GitHub Pages** provides free, secure HTTPS hosting.
- **Version control** tracks all changes and deployments.
- **No backend** or database required.
- **High trust**: viewers see a familiar and secure domain, not a downloaded file.

---

## 🧭 Future Enhancements
- Automate commits via GitHub API for one-click publishing.
- Add web form or dashboard for submitting meeting data.
- Integrate Midnight / zk-proof system for verified attendance.

---

## 📞 Maintainer
**Project Lead:** Newman S. Lanier  
**Repo:** https://github.com/globalpresencemap/globalpresencemap.github.io  
**Purpose:** Secure, shareable visualization of global community presence.

