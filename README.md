# 🌍 Global Presence Map

**Version:** v0.2.0 — *Docs & Stability Release*  
**Date:** 2025-10-30

The **Global Presence Map** visualizes community member locations around the world. Each member is represented by a flowing connection on an interactive 3D globe. It’s a playful way to see where we all are — and how connected we’ve become.

---

## 🚀 Overview

This release stabilizes the core architecture, adds robust data handling, and documents how the system works. The project now supports static HTML export and automatic deployment to GitHub Pages for easy public hosting.

**Highlights:**
- Add multiple members at once
- Automatically geocode city names (with fallback)
- Visualize member connections with animated lines
- Export as static HTML for hosting anywhere
- Automatic GitHub Pages deployment on push
- Improved layout and data structure

---

## 🧩 Project Structure

```
root/
├── app/                  # Next.js app directory
│   ├── page.tsx          # Main app entry
│   └── api/              # Future API routes
├── src/
│   ├── components/
│   │   └── MeetingGlobe.tsx     # 3D globe visualization component
│   ├── data/
│   │   ├── members.json          # Member name + city data
│   │   └── cityCoords.ts         # Static city coordinates fallback
│   ├── lib/
│   │   └── geocode.ts            # Geocoding helper functions
│   └── scripts/                  # (Optional) background scripts
├── public/
│   └── assets/                   # Static assets
├── README.md
└── CHANGELOG.md
```

---

## 🧠 How It Works

### 1. Member Data
Each member is stored in `src/data/members.json` (use initials for privacy):
```json
[
  {
    "name": "A",
    "city": "Lisbon"
  },
  {
    "name": "K",
    "city": "Tokyo"
  }
]
```

When the app loads, it checks each city:
- If coordinates exist in `cityCoords.ts`, they’re used immediately.
- If not, the app calls the **OpenCage Geocoding API** and caches the result locally.

### 2. Visualization
The `MeetingGlobe` component renders pins and flowing arcs using `react-globe.gl` and Three.js.

### 3. Connections
Lines represent relationships or meeting presence between participants — either random connections or grouped by session data (future feature).

---

## ⚙️ Setup & Run

### Prerequisites
- Node.js ≥ 20
- npm, pnpm, or yarn installed

### Install
```bash
npm install
```

### Run the app
```bash
npm run dev
```

### Build for production
```bash
npm run build && npm run start
```

### Build static HTML export
```bash
npm run build
```
The static HTML files will be generated in the `out/` directory.

---

## 🌐 GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages. The meeting globe is hosted as a static HTML site that can be publicly accessed.

### How it Works

1. **Update members**: Edit `public/data/members.json` to add, remove, or modify member locations
2. **Commit and push**: Push changes to the `main` branch
3. **Automatic deployment**: GitHub Actions will automatically build and deploy the updated globe to GitHub Pages
4. **View live site**: Access the globe at: `https://[username].github.io/Global-Presence-Map/`

### Manual Deployment

You can also trigger a deployment manually:
1. Go to the "Actions" tab in GitHub
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow"

### First-Time Setup

To enable GitHub Pages for this repository:
1. Go to repository Settings → Pages
2. Under "Build and deployment", select "GitHub Actions" as the source
3. The workflow will automatically deploy on the next push to `main`

### Local Export

To export the HTML locally for manual hosting:
```bash
npm run build
# Static files are in the ./out directory
```

---

## 🧭 Roadmap

### ✅ Done
- [x] Add all members at once
- [x] Show cities in JSON and add new-city function
- [x] Flowing connections instead of pins
- [x] Automatic geocoder fallback (OpenCage)
- [x] Shareable or embeddable globe view (GitHub Pages deployment)
- [x] Static HTML export for easy hosting

### 🧩 In Progress
- [ ] Clean input capitalization and spacing
- [ ] Bermuda Triangle fallback for unknown cities

### 🔮 Future Features
- [ ] 2D map option
- [ ] Night/day shadow for timezone visualization
- [ ] Zoom plugin integration
- [ ] Live-refresh when `members.json` updates
- [ ] Region or join-date color coding

---

## 🧾 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed history.

---

## 🧱 Tech Stack

- **Next.js (App Router)** — frontend framework
- **React Three Fiber / React-Globe.gl** — 3D globe visualization
- **TypeScript** — typed logic & clarity
- **Tailwind CSS** — styling (planned)
- **OpenCage API** — city-to-coordinates lookup

---

## 🪄 Development Notes

- The app gracefully handles unknown cities using a geocoder fallback.
- You can later run a background script (`src/scripts/geocode-missing.ts`) to resolve any cities with missing coordinates.
- Future optimization: cache results or refactor into a small backend service.

---

## 📜 License

MIT License © 2025 Global Presence Map contributors.

---

## 🙌 Credits

- **react-globe.gl** — for the 3D visualization.
- **Three.js** — underlying 3D engine.
- **OpenCage Geocoder** — for reliable global geocoding.

---

> *Built by the Global Presence Map team — connecting the world, one pin at a time.*

