#!/usr/bin/env node
/**
 * Prepare for static export by temporarily renaming the API directory
 * This prevents Next.js from trying to include server-side API routes in the static export
 */

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'app', 'api');
const apiDirBackup = path.join(__dirname, '..', '.api-backup');

const isExportMode = process.env.NEXT_PUBLIC_EXPORT_MODE === 'true' || process.env.EXPORT_MODE === 'true';

if (isExportMode) {
  if (fs.existsSync(apiDir)) {
    console.log('📦 Export mode detected: Temporarily moving API directory...');
    if (fs.existsSync(apiDirBackup)) {
      fs.rmSync(apiDirBackup, { recursive: true, force: true });
    }
    fs.renameSync(apiDir, apiDirBackup);
    console.log('✅ API directory moved outside app folder');
  }
} else {
  if (fs.existsSync(apiDirBackup) && !fs.existsSync(apiDir)) {
    console.log('🔄 Restoring API directory from backup...');
    fs.renameSync(apiDirBackup, apiDir);
    console.log('✅ API directory restored');
  }
}
