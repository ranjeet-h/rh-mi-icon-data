#!/usr/bin/env node

import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ICON_SOURCE_URL =
  'https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsOutlined%5BFILL,GRAD,opsz,wght%5D.codepoints';
const STYLES = ['rounded', 'outlined', 'sharp'];

class FetchStatusError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'FetchStatusError';
    this.status = status;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseArgs = () => {
  const options = {
    outDir: 'registry',
    limit: undefined,
    icons: [],
    concurrency: 24,
    retries: 2,
    force: false,
    logEvery: 100,
    prune: true,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--out=')) {
      options.outDir = arg.slice('--out='.length);
      continue;
    }
    if (arg.startsWith('--limit=')) {
      const limit = Number(arg.slice('--limit='.length));
      if (!Number.isInteger(limit) || limit <= 0) {
        throw new Error(`Invalid --limit value: ${arg}`);
      }
      options.limit = limit;
      continue;
    }
    if (arg.startsWith('--icons=')) {
      options.icons = arg
        .slice('--icons='.length)
        .split(',')
        .map((icon) => icon.trim())
        .filter(Boolean);
      continue;
    }
    if (arg.startsWith('--concurrency=')) {
      const concurrency = Number(arg.slice('--concurrency='.length));
      if (!Number.isInteger(concurrency) || concurrency <= 0) {
        throw new Error(`Invalid --concurrency value: ${arg}`);
      }
      options.concurrency = concurrency;
      continue;
    }
    if (arg.startsWith('--retries=')) {
      const retries = Number(arg.slice('--retries='.length));
      if (!Number.isInteger(retries) || retries < 0) {
        throw new Error(`Invalid --retries value: ${arg}`);
      }
      options.retries = retries;
      continue;
    }
    if (arg.startsWith('--log-every=')) {
      const logEvery = Number(arg.slice('--log-every='.length));
      if (!Number.isInteger(logEvery) || logEvery <= 0) {
        throw new Error(`Invalid --log-every value: ${arg}`);
      }
      options.logEvery = logEvery;
      continue;
    }
    if (arg === '--force') {
      options.force = true;
      continue;
    }
    if (arg === '--no-prune') {
      options.prune = false;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      console.log(`Usage:
  node scripts/scraper/scrape-icons.mjs [--limit=<n>] [--icons=a,b,c] [--out=registry] [--concurrency=24] [--retries=2] [--log-every=100] [--force] [--no-prune]

Examples:
  node scripts/scraper/scrape-icons.mjs
  node scripts/scraper/scrape-icons.mjs --limit=500 --concurrency=32
  node scripts/scraper/scrape-icons.mjs --icons=search,home,arrow_back --force
`);
      process.exit(0);
    }
    throw new Error(`Unknown arg: ${arg}`);
  }

  return options;
};

const fetchCodepointNames = async () => {
  const response = await fetch(ICON_SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch icon list (${response.status})`);
  }
  const text = await response.text();
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/)[0])
    .filter((name) => /^[a-z0-9_]+$/.test(name));
};

const parseSvg = (svgText) => {
  const viewBox = svgText.match(/viewBox="([^"]+)"/)?.[1];
  if (!viewBox) {
    throw new Error('SVG viewBox not found');
  }
  const pathMatches = [...svgText.matchAll(/<path[^>]*d="([^"]+)"/g)];
  if (pathMatches.length === 0) {
    throw new Error('No <path d="..."> found in SVG');
  }
  const pathData = pathMatches.map((match) => match[1]).join(' ');
  return { viewBox, pathData };
};

const fetchTextWithRetry = async (url, retries) => {
  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new FetchStatusError(`Request failed (${response.status}) for ${url}`, response.status);
      }
      return await response.text();
    } catch (error) {
      if (error instanceof FetchStatusError && error.status === 404) {
        throw error;
      }
      if (attempt >= retries) {
        throw error;
      }
      await sleep(300 * 2 ** attempt);
      attempt += 1;
    }
  }
};

const fetchVariant = async ({ style, iconName, fill, retries }) => {
  const variant = fill === 1 ? 'fill1' : 'default';
  const url = `https://fonts.gstatic.com/s/i/short-term/release/materialsymbols${style}/${iconName}/${variant}/24px.svg`;
  const svg = await fetchTextWithRetry(url, retries);
  return parseSvg(svg);
};

const slugTags = (iconName) => iconName.split('_').filter(Boolean);

const writeJson = async (target, value) => {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const readJsonIfExists = async (target) => {
  try {
    const raw = await readFile(target, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

const validateIconPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Icon payload must be an object');
  }
  if (!/^[a-z0-9_]+$/.test(payload.name)) {
    throw new Error(`Invalid icon name: ${payload.name}`);
  }
  if (!STYLES.includes(payload.style)) {
    throw new Error(`Invalid icon style: ${payload.style}`);
  }
  if (typeof payload.viewBox !== 'string' || payload.viewBox.length === 0) {
    throw new Error(`Invalid viewBox for icon: ${payload.name}`);
  }
  if (!payload.paths || typeof payload.paths.fill0 !== 'string' || typeof payload.paths.fill1 !== 'string') {
    throw new Error(`Invalid path payload for icon: ${payload.name}`);
  }
};

const validateMetadataPayload = (payload) => {
  if (!payload || !Array.isArray(payload.icons)) {
    throw new Error('Metadata payload must include icons array');
  }
  for (const icon of payload.icons) {
    if (!icon || typeof icon.name !== 'string' || !/^[a-z0-9_]+$/.test(icon.name)) {
      throw new Error(`Invalid metadata icon name: ${icon?.name}`);
    }
  }
};

const loadOrFetchStyle = async ({ outRoot, iconName, style, force, retries }) => {
  const target = path.join(outRoot, style, `${iconName}.json`);
  if (!force) {
    const existing = await readJsonIfExists(target);
    if (
      existing &&
      existing.name === iconName &&
      existing.style === style &&
      typeof existing.viewBox === 'string' &&
      typeof existing.paths?.fill0 === 'string' &&
      typeof existing.paths?.fill1 === 'string'
    ) {
      return existing;
    }
  }

  const [fill0, fill1] = await Promise.all([
    fetchVariant({ style, iconName, fill: 0, retries }),
    fetchVariant({ style, iconName, fill: 1, retries }),
  ]);

  const payload = {
    name: iconName,
    style,
    viewBox: fill0.viewBox,
    paths: { fill0: fill0.pathData, fill1: fill1.pathData },
    tags: slugTags(iconName),
  };

  validateIconPayload(payload);
  await writeJson(target, payload);
  return payload;
};

const runPool = async (items, concurrency, worker) => {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const currentIndex = index;
      index += 1;
      if (currentIndex >= items.length) {
        return;
      }
      await worker(items[currentIndex], currentIndex);
    }
  });
  await Promise.all(workers);
};

const pruneRemovedIcons = async (outRoot, selectedNames) => {
  const selected = new Set(selectedNames);
  let deleted = 0;

  for (const style of STYLES) {
    const styleDir = path.join(outRoot, style);
    let files;
    try {
      files = await readdir(styleDir);
    } catch (error) {
      if (error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }

    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }
      const iconName = file.slice(0, -'.json'.length);
      if (selected.has(iconName)) {
        continue;
      }
      await rm(path.join(styleDir, file));
      deleted += 1;
    }
  }

  return deleted;
};

const run = async () => {
  const options = parseArgs();
  const outRoot = path.resolve(process.cwd(), options.outDir);
  const allNames = options.icons.length > 0 ? options.icons : await fetchCodepointNames();
  const selectedNames = options.limit ? allNames.slice(0, options.limit) : allNames;

  const metadata = [];
  const aliasMap = {};
  const failures = [];
  const startedAt = Date.now();
  let processed = 0;

  await runPool(selectedNames, options.concurrency, async (iconName) => {
    const styleResults = {};

    for (const style of STYLES) {
      try {
        const payload = await loadOrFetchStyle({
          outRoot,
          iconName,
          style,
          force: options.force,
          retries: options.retries,
        });
        styleResults[style] = payload;
      } catch (error) {
        failures.push({
          iconName,
          style,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (Object.keys(styleResults).length > 0) {
      metadata.push({
        name: iconName,
        tags: slugTags(iconName),
        category: 'material-symbols',
        styles: Object.keys(styleResults),
      });
      aliasMap[iconName.replace(/_/g, '-')] = iconName;
    }

    processed += 1;
    if (processed % options.logEvery === 0 || processed === selectedNames.length) {
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
      console.log(
        `Progress: ${processed}/${selectedNames.length} icons processed in ${elapsed}s (failures=${failures.length})`,
      );
    }
  });

  const metadataPayload = {
    icons: metadata.sort((a, b) => a.name.localeCompare(b.name)),
  };
  validateMetadataPayload(metadataPayload);

  const sortedAliasEntries = Object.entries(aliasMap).sort(([a], [b]) => a.localeCompare(b));
  const sortedAliasMap = Object.fromEntries(sortedAliasEntries);

  await writeJson(path.join(outRoot, 'metadata.json'), metadataPayload);
  await writeJson(path.join(outRoot, 'aliases.json'), sortedAliasMap);

  let prunedCount = 0;
  if (options.prune) {
    prunedCount = await pruneRemovedIcons(outRoot, metadataPayload.icons.map((icon) => icon.name));
  }

  console.log('Scrape complete.');
  console.log(`Icons requested: ${selectedNames.length}`);
  console.log(`Icons written: ${metadataPayload.icons.length}`);
  console.log(`Failures: ${failures.length}`);
  console.log(`Pruned files: ${prunedCount}`);
  if (failures.length > 0) {
    const preview = failures.slice(0, 30);
    console.log(`Failure preview (${preview.length}):`);
    for (const entry of preview) {
      console.log(`- ${entry.iconName} [${entry.style}] -> ${entry.error}`);
    }
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
