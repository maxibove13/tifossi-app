#!/usr/bin/env node

/**
 * Copy compiled Strapi files into the directory that runtime expects.
 * Strapi loads configuration from <distDir>/config and src from <distDir>/src,
 * but the TypeScript build places the compiled files under dist/strapi/* because
 * the project imports shared code outside of the Strapi directory.
 */

const fs = require('fs');
const path = require('path');

const distRoot = path.resolve(__dirname, '..', 'dist');

const syncPaths = [
  { source: 'config', target: 'config' },
  { source: 'src', target: 'src' }
];

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcEntry = path.join(src, entry.name);
      const destEntry = path.join(dest, entry.name);
      copyRecursive(srcEntry, destEntry);
    }
    return;
  }

  fs.copyFileSync(src, dest);
}

function syncDirectory(sourceName, targetName) {
  const sourceDir = path.join(distRoot, 'strapi', sourceName);
  const targetDir = path.join(distRoot, targetName);

  if (!fs.existsSync(sourceDir)) {
    console.warn(`[sync-compiled-config] Source directory missing: ${sourceDir}`);
    return false;
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  copyRecursive(sourceDir, targetDir);
  console.log(`[sync-compiled-config] Synced ${sourceName} -> ${targetName}`);
  return true;
}

function syncAll() {
  // Check if dist/strapi exists (needed when compiling external dependencies)
  const strapiDistExists = fs.existsSync(path.join(distRoot, 'strapi'));

  if (!strapiDistExists) {
    console.log('[sync-compiled-config] No dist/strapi directory - compilation output is already in correct location');
    return true;
  }

  let allSuccess = true;

  for (const { source, target } of syncPaths) {
    const success = syncDirectory(source, target);
    if (!success) {
      allSuccess = false;
    }
  }

  return allSuccess;
}

if (require.main === module) {
  const ok = syncAll();
  if (!ok) {
    process.exitCode = 1;
  }
}

module.exports = { syncAll };
