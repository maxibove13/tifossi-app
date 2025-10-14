#!/usr/bin/env node

/**
 * Copy compiled Strapi files into the directory that runtime expects.
 * Strapi loads configuration from <distDir>/config and src from <distDir>/src,
 * but the TypeScript build places the compiled files under dist/strapi/* because
 * the project imports shared code outside of the Strapi directory.
 */

import fs from 'node:fs';
import path from 'node:path';

const distRoot = path.resolve(__dirname, '..', 'dist');
const srcRoot = path.resolve(__dirname, '..', 'src');

interface SyncPath {
  source: string;
  target: string;
}

const syncPaths: SyncPath[] = [
  { source: 'config', target: 'config' },
  { source: 'src', target: 'src' }
];

/**
 * Recursively copy a directory, replacing the destination completely
 */
function copyRecursive(src: string, dest: string): void {
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

/**
 * Merge a directory into destination, only copying files that don't exist.
 * Leaves existing compiled JS files untouched.
 */
function mergeDirectory(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    return;
  }

  // Ensure destination directory exists
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively merge subdirectories
      mergeDirectory(srcPath, destPath);
    } else {
      // Only copy file if it doesn't exist at destination
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

/**
 * Validate that Strapi build produced expected output directories.
 * Fails loudly if artifacts are missing so we can fix the build at source.
 */
function validateBuildOutput(): boolean {
  const requiredDirs = [
    path.join(distRoot, 'strapi', 'src', 'api'),
  ];

  // Optional but expected directories (warn if missing)
  const expectedDirs = [
    path.join(distRoot, 'strapi', 'src', 'policies'),
    path.join(distRoot, 'strapi', 'src', 'middlewares'),
  ];

  let hasErrors = false;

  // Check required directories
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      console.error(`[sync-compiled-config] ERROR: Required build output missing: ${dir}`);
      console.error('[sync-compiled-config] Fix Strapi build configuration or tsconfig.json');
      hasErrors = true;
    }
  }

  // Check expected directories (warn only)
  for (const dir of expectedDirs) {
    if (!fs.existsSync(dir)) {
      console.warn(`[sync-compiled-config] WARNING: Expected directory missing: ${dir}`);
      console.warn('[sync-compiled-config] This may cause runtime issues if these modules are used');
    }
  }

  return !hasErrors;
}

/**
 * Sync a directory from dist/strapi/* to dist/*
 */
function syncDirectory(sourceName: string, targetName: string): boolean {
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

/**
 * Copy runtime-required directories additively from source
 */
function syncRuntimeDirectories(): void {
  // Ensure dist/src exists before merging
  const distSrcDir = path.join(distRoot, 'src');
  fs.mkdirSync(distSrcDir, { recursive: true });

  const runtimeDirs = ['policies', 'middlewares', 'extensions'];

  for (const dirName of runtimeDirs) {
    const strapiCompiledDir = path.join(distRoot, 'strapi', 'src', dirName);
    const destDir = path.join(distSrcDir, dirName);

    // Try to copy from Strapi's compiled output first
    if (fs.existsSync(strapiCompiledDir)) {
      mergeDirectory(strapiCompiledDir, destDir);
      console.log(`[sync-compiled-config] Merged ${dirName} from Strapi build output`);
    } else {
      // If Strapi didn't compile it, log warning (may be empty directory)
      const srcDir = path.join(srcRoot, dirName);
      if (fs.existsSync(srcDir) && fs.readdirSync(srcDir).length > 0) {
        console.warn(`[sync-compiled-config] WARNING: ${dirName} not in Strapi build output, but exists in source`);
        console.warn(`[sync-compiled-config] This may cause runtime errors. Check Strapi build configuration.`);
      }
    }
  }
}

/**
 * Main sync function
 */
function syncAll(): boolean {
  // Check if dist/strapi exists (needed when compiling external dependencies)
  const strapiDistExists = fs.existsSync(path.join(distRoot, 'strapi'));

  if (!strapiDistExists) {
    console.log('[sync-compiled-config] No dist/strapi directory - compilation output is already in correct location');
    return true;
  }

  // Validate build output before syncing
  if (!validateBuildOutput()) {
    console.error('[sync-compiled-config] Build validation failed');
    return false;
  }

  let allSuccess = true;

  // Sync main directories (config and src)
  for (const { source, target } of syncPaths) {
    const success = syncDirectory(source, target);
    if (!success) {
      allSuccess = false;
    }
  }

  // Sync runtime-required directories additively
  syncRuntimeDirectories();

  return allSuccess;
}

if (require.main === module) {
  const ok = syncAll();
  if (!ok) {
    process.exitCode = 1;
  }
}

module.exports = { syncAll };
