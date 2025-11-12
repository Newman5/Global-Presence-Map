## 🤖 Prompt for Deployment Agent: Global Presence Map

### Context
You are a technical collaborator assisting with the **Global Presence Map** project — an interactive 3D globe visualization that displays community members and meeting locations.

Currently, the project can export a static `.html` file for each meeting (e.g., `meeting-2025-11-12-abc123.html`). These files contain all JavaScript, CSS, and data needed to display the globe.

The goal of this task is to make those exported HTML files accessible via a **live HTTPS URL** without requiring users to download or open them locally.

---

### 🎯 Objective
Create a secure, shareable URL for each meeting globe using **GitHub Pages** (or Cloudflare Pages) to host static files.

Example target URL:
```
https://globalpresencemap.com/meetings/meeting-2025-11-12-abc123
```

---

### 🪜 Required Tasks

1. **Repository Setup**
   - Create or confirm a GitHub repository named `globalpresencemap.github.io`.
   - Verify that GitHub Pages hosting is enabled for the `main` branch (root folder).
   - Ensure HTTPS is active.

2. **Structure for Meeting Files**
   - Create a `/meetings` directory in the repository.
   - Verify that pushing a file into `/meetings` makes it live under:
     ```
     https://globalpresencemap.github.io/meetings/<filename>.html
     ```

3. **Automated Local Push Workflow**
   - Implement or document a local automation script that performs:
     ```bash
     cp /path/to/generated/meeting-2025-11-12-abc123.html ./meetings/
     git add meetings/meeting-2025-11-12-abc123.html
     git commit -m "Add meeting 2025-11-12-abc123"
     git push
     ```
   - Confirm that GitHub Pages rebuilds and serves the new file automatically.

4. **Verification**
   - Deploy a sample HTML file (use placeholder content if needed).
   - Confirm that it loads correctly in a browser with HTTPS.

5. **Documentation**
   - Create an `INSTRUCTIONS.md` file describing setup and deployment steps for future contributors.

---

### 🧰 Deliverables
- Live working deployment on GitHub Pages or Cloudflare Pages.
- `INSTRUCTIONS.md` detailing setup, deployment, and verification.
- Sample `/meetings/meeting-demo.html` file accessible via public URL.

---

### 🧭 Key Notes
- No backend or database required — static hosting only.
- Prioritize simplicity, security, and transparency.
- This is the **MVP**: future automation (GitHub API commits, uploads, or ZK proofs) may come later.
- Ensure everything uses HTTPS and a recognizable domain.

---

### ✅ Success Criteria
- A test file is live and viewable at a URL like:
  `https://globalpresencemap.com/meetings/meeting-demo.html`
- The process to add new meetings is fully documented and repeatable.
- No manual editing of GitHub Pages configuration is needed after initial setup.

---

**Project Lead:** Newman S. Lanier  
**Repository:** `https://github.com/globalpresencemap/globalpresencemap.github.io`  
**Purpose:** Secure, shareable visualization of global community presence.

