#!/usr/bin/env node
/**
 * Cleanup after static export by restoring the API directory
 */

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'app', 'api');
const apiDirBackup = path.join(__dirname, '..', '.api-backup');

if (fs.existsSync(apiDirBackup) && !fs.existsSync(apiDir)) {
  console.log('🔄 Restoring API directory after export...');
  fs.renameSync(apiDirBackup, apiDir);
  console.log('✅ API directory restored');
}
