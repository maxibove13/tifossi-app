#!/usr/bin/env node

/**
 * Copy compiled Strapi config files into the directory that runtime expects.
 * Strapi loads configuration from <distDir>/config, but the TypeScript build
 * currently places the compiled files under dist/strapi/config because the
 * project imports shared code outside of the Strapi directory.
 */

const fs = require('fs');
const path = require('path');

const distRoot = path.resolve(__dirname, '..', 'dist');
const sourceDir = path.join(distRoot, 'strapi', 'config');
const targetDir = path.join(distRoot, 'config');

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

function syncConfig() {
  if (!fs.existsSync(sourceDir)) {
    console.warn('[sync-compiled-config] Source directory missing:', sourceDir);
    return false;
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  copyRecursive(sourceDir, targetDir);
  return true;
}

if (require.main === module) {
  const ok = syncConfig();
  if (!ok) {
    process.exitCode = 1;
  }
}

module.exports = { syncConfig };
