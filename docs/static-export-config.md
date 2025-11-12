# Static Export Configuration

## Problem

Next.js static export (`output: 'export'`) does not support server-side API routes because they require a Node.js runtime. When attempting to build with `output: 'export'`, the build fails with errors like:

```
Error: export const dynamic = "force-static"/export const revalidate not configured on route "/api/add-member" with "output: export".
```

## Solution

We use a prebuild script to temporarily move the `app/api` directory outside of the app directory during static export builds. This prevents Next.js from attempting to include the API routes in the static build.

### How It Works

1. **During Export Build** (`npm run export`):
   - `scripts/prepare-export.cjs` moves `app/api` to `.api-backup` (outside the app directory)
   - Next.js builds the static site without API routes
   - `scripts/cleanup-export.cjs` restores `app/api` from `.api-backup`

2. **During Dev/Regular Build** (`npm run dev` or `npm run build`):
   - API routes remain in `app/api` and work normally
   - The prepare script checks if we're in export mode and only moves the directory when `NEXT_PUBLIC_EXPORT_MODE=true`

### Files Modified

- `package.json`: Updated `export` and `dev` scripts to use the prepare/cleanup scripts
- `scripts/prepare-export.cjs`: Moves API directory before export build
- `scripts/cleanup-export.cjs`: Restores API directory after export build
- `.gitignore`: Added `.api-backup` to ignore temporary backup directory

### Usage

**Development mode** (API routes work):
```bash
npm run dev
```

**Production build** (API routes work):
```bash
npm run build
npm run start
```

**Static export** (API routes excluded):
```bash
npm run export
```

The exported static files will be in the `out/` directory and can be deployed to GitHub Pages or any static hosting service.

### Client-Side Behavior

The client-side code in `app/globe/page.tsx` already handles API failures gracefully:
- It attempts to POST to `/api/add-member` and catches errors
- It falls back to client-side download when `/api/save-meeting` fails
- The exported static site works without API routes

## Benefits

1. ✅ API routes work normally in development
2. ✅ API routes work normally in production (non-export) builds
3. ✅ Static export builds succeed without API routes
4. ✅ No code changes needed in the actual routes
5. ✅ Simple and maintainable solution
