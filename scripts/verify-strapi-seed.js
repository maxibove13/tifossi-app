#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const args = new Set(process.argv.slice(2));
const showHelp = args.has('--help') || args.has('-h');
const skipOrderCheck = args.has('--no-order');
const includeInactive = args.has('--include-inactive');

if (showHelp) {
  console.log(
    [
      'Verify Strapi categories/models against app hardcoded data.',
      '',
      'Usage:',
      '  STRAPI_URL=... STRAPI_API_TOKEN=... node scripts/verify-strapi-seed.js',
      '',
      'Options:',
      '  --no-order         Skip displayOrder-based ordering check for categories',
      '  --include-inactive Include inactive categories/models in comparisons',
    ].join('\n')
  );
  process.exit(0);
}

const BASE_URL =
  process.env.STRAPI_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL;

if (!BASE_URL) {
  console.error('ERROR: Missing STRAPI_URL (or EXPO_PUBLIC_API_BASE_URL) environment variable.');
  process.exit(1);
}

const API_TOKEN = process.env.STRAPI_API_TOKEN || process.env.STRAPI_TOKEN;
const repoRoot = path.resolve(__dirname, '..');

function readFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function extractArrayLiteral(source, exportName) {
  const exportIndex = source.indexOf(`export const ${exportName}`);
  if (exportIndex === -1) {
    throw new Error(`Could not find export: ${exportName}`);
  }

  const equalsIndex = source.indexOf('=', exportIndex);
  if (equalsIndex === -1) {
    throw new Error(`Could not find assignment for: ${exportName}`);
  }

  const openBracketIndex = source.indexOf('[', equalsIndex);
  if (openBracketIndex === -1) {
    throw new Error(`Could not find array start for: ${exportName}`);
  }

  let depth = 0;
  let startIndex = -1;
  let endIndex = -1;
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = openBracketIndex; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inString) {
      if (char === '\\') {
        i += 1;
        continue;
      }
      if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (char === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === '[') {
      if (depth === 0) startIndex = i;
      depth += 1;
      continue;
    }

    if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Could not parse array for: ${exportName}`);
  }

  return source.slice(startIndex, endIndex + 1);
}

function evaluateArrayLiteral(arrayLiteral, exportName) {
  try {
    const result = vm.runInNewContext(`(${arrayLiteral})`, {});
    if (!Array.isArray(result)) {
      throw new Error('Not an array');
    }
    return result;
  } catch (error) {
    throw new Error(`Failed to evaluate ${exportName}: ${error.message}`);
  }
}

function loadExpectedCategories() {
  const source = readFile('app/_data/categories.ts');
  const arrayLiteral = extractArrayLiteral(source, 'productCategories');
  const entries = evaluateArrayLiteral(arrayLiteral, 'productCategories');

  return entries.map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    name: entry.name,
  }));
}

function loadExpectedModels() {
  const source = readFile('app/_data/models.ts');
  const arrayLiteral = extractArrayLiteral(source, 'productModels');
  const entries = evaluateArrayLiteral(arrayLiteral, 'productModels');

  return entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    categoryId: entry.categoryId,
  }));
}

async function fetchCollection(endpoint, options = {}) {
  const pageSize = 100;
  let page = 1;
  const results = [];
  const baseUrl = BASE_URL.replace(/\/$/, '');

  while (true) {
    const url = new URL(`${baseUrl}/api/${endpoint}`);
    url.searchParams.set('pagination[page]', page.toString());
    url.searchParams.set('pagination[pageSize]', pageSize.toString());

    if (options.sort) {
      url.searchParams.append('sort', options.sort);
    }

    if (options.populate) {
      options.populate.forEach((field) => url.searchParams.append('populate', field));
    }

    const headers = {
      'Content-Type': 'application/json',
    };

    if (API_TOKEN) {
      headers.Authorization = `Bearer ${API_TOKEN}`;
    }

    const response = await fetch(url.toString(), { headers });
    const json = await response.json();

    if (!response.ok) {
      throw new Error(
        `Strapi request failed (${response.status}): ${JSON.stringify(json, null, 2)}`
      );
    }

    const data = Array.isArray(json.data) ? json.data : [];
    results.push(...data);

    const pagination = json.meta && json.meta.pagination;
    if (pagination) {
      if (page >= pagination.pageCount) break;
    } else if (data.length < pageSize) {
      break;
    }

    page += 1;
  }

  return results;
}

function compareCategories(expected, actual, issues) {
  const expectedSlugs = new Set(expected.map((cat) => cat.slug));
  const actualSlugs = new Set(actual.map((cat) => cat.slug));

  const missing = expected.filter((cat) => !actualSlugs.has(cat.slug)).map((cat) => cat.slug);
  const extra = actual.filter((cat) => !expectedSlugs.has(cat.slug)).map((cat) => cat.slug);

  if (missing.length > 0) {
    issues.push(`Missing categories in Strapi: ${missing.join(', ')}`);
  }

  if (extra.length > 0) {
    issues.push(`Unexpected categories in Strapi: ${extra.join(', ')}`);
  }

  expected.forEach((cat) => {
    const match = actual.find((item) => item.slug === cat.slug);
    if (match && match.name !== cat.name) {
      issues.push(
        `Category name mismatch for "${cat.slug}": expected "${cat.name}", got "${match.name}"`
      );
    }
  });

  if (!skipOrderCheck) {
    const missingOrder = actual
      .filter((cat) => expectedSlugs.has(cat.slug))
      .filter((cat) => typeof cat.displayOrder !== 'number');

    if (missingOrder.length > 0) {
      issues.push(
        `Missing displayOrder for categories: ${missingOrder
          .map((cat) => cat.slug)
          .join(', ')}`
      );
      return;
    }

    const actualOrder = actual
      .filter((cat) => expectedSlugs.has(cat.slug))
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((cat) => cat.slug);

    const expectedOrder = expected.map((cat) => cat.slug);
    const orderMatches = actualOrder.length === expectedOrder.length &&
      actualOrder.every((slug, index) => slug === expectedOrder[index]);

    if (!orderMatches) {
      issues.push(
        `Category displayOrder mismatch. Expected order: ${expectedOrder.join(
          ' -> '
        )}; actual: ${actualOrder.join(' -> ')}`
      );
    }
  }
}

function compareModels(expected, actual, issues) {
  const expectedIds = new Set(expected.map((model) => model.id));
  const actualSlugs = new Set(actual.map((model) => model.slug));

  const missing = expected.filter((model) => !actualSlugs.has(model.id)).map((model) => model.id);
  const extra = actual.filter((model) => !expectedIds.has(model.slug)).map((model) => model.slug);

  if (missing.length > 0) {
    issues.push(`Missing models in Strapi: ${missing.join(', ')}`);
  }

  if (extra.length > 0) {
    issues.push(`Unexpected models in Strapi: ${extra.join(', ')}`);
  }

  expected.forEach((model) => {
    const match = actual.find((item) => item.slug === model.id);
    if (!match) return;

    if (!match.category || !match.category.slug) {
      issues.push(`Model "${model.id}" is missing category relation in Strapi`);
      return;
    }

    if (match.category.slug !== model.categoryId) {
      issues.push(
        `Model "${model.id}" category mismatch: expected "${model.categoryId}", got "${match.category.slug}"`
      );
    }

    if (match.name !== model.name) {
      issues.push(
        `Model name mismatch for "${model.id}": expected "${model.name}", got "${match.name}"`
      );
    }
  });
}

async function main() {
  console.log('Verifying Strapi categories/models against app hardcoded data...');
  console.log(`Strapi URL: ${BASE_URL}`);

  const expectedCategories = loadExpectedCategories();
  const expectedModels = loadExpectedModels();

  const [categories, models] = await Promise.all([
    fetchCollection('categories', { sort: 'displayOrder:asc' }),
    fetchCollection('product-models', { sort: 'displayOrder:asc', populate: ['category'] }),
  ]);

  const issues = [];

  const activeCategories = includeInactive
    ? categories
    : categories.filter((category) => category.isActive !== false);
  const activeModels = includeInactive ? models : models.filter((model) => model.isActive !== false);

  compareCategories(expectedCategories, activeCategories, issues);
  compareModels(expectedModels, activeModels, issues);

  if (issues.length > 0) {
    console.error(`ERROR: Verification failed with ${issues.length} issue(s):`);
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exit(1);
  }

  console.log('Verification passed. Strapi matches app categories and models.');
}

main().catch((error) => {
  console.error(`ERROR: Verification failed: ${error.message}`);
  process.exit(1);
});
