#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ICON_SOURCE_URL =
  'https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsOutlined%5BFILL,GRAD,opsz,wght%5D.codepoints';
const STYLES = ['rounded', 'outlined', 'sharp'];
const FILLS = [0, 1];

const parseArgs = () => {
  const options = {
    outDir: 'registry',
    limit: undefined,
    icons: [],
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
    if (arg === '--help' || arg === '-h') {
      console.log(`Usage:
  node scripts/scraper/scrape-icons.mjs [--limit=<n>] [--icons=a,b,c] [--out=registry]

Examples:
  node scripts/scraper/scrape-icons.mjs --limit=50
  node scripts/scraper/scrape-icons.mjs --icons=search,home,arrow_back
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
    .filter(Boolean);
};

const extractPathData = (svgText) => {
  const matches = [...svgText.matchAll(/<path[^>]*d="([^"]+)"/g)];
  if (matches.length === 0) {
    throw new Error('No <path d="..."> found in SVG');
  }
  return matches.map((match) => match[1]).join(' ');
};

const fetchVariantPath = async ({ style, iconName, fill }) => {
  const variant = fill === 1 ? 'fill1' : 'default';
  const url = `https://fonts.gstatic.com/s/i/short-term/release/materialsymbols${style}/${iconName}/${variant}/24px.svg`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${iconName} (${style}, fill=${fill}) [${response.status}]`);
  }
  const svg = await response.text();
  return extractPathData(svg);
};

const slugTags = (iconName) => iconName.split('_').filter(Boolean);

const writeJson = async (target, value) => {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
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

const run = async () => {
  const options = parseArgs();
  const outRoot = path.resolve(process.cwd(), options.outDir);
  const allNames = options.icons.length > 0 ? options.icons : await fetchCodepointNames();
  const selectedNames = options.limit ? allNames.slice(0, options.limit) : allNames;

  const metadata = [];
  const aliasMap = {};
  const failures = [];

  for (const iconName of selectedNames) {
    const styleResults = {};

    for (const style of STYLES) {
      try {
        const fill0 = await fetchVariantPath({ style, iconName, fill: 0 });
        const fill1 = await fetchVariantPath({ style, iconName, fill: 1 });

        const iconPayload = {
          name: iconName,
          style,
          viewBox: '0 0 24 24',
          paths: { fill0, fill1 },
          tags: slugTags(iconName),
        };

        validateIconPayload(iconPayload);
        await writeJson(path.join(outRoot, style, `${iconName}.json`), iconPayload);
        styleResults[style] = true;
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
  }

  const metadataPayload = { icons: metadata };
  validateMetadataPayload(metadataPayload);

  await writeJson(path.join(outRoot, 'metadata.json'), metadataPayload);
  await writeJson(path.join(outRoot, 'aliases.json'), aliasMap);

  console.log(`Scrape complete.`);
  console.log(`Icons requested: ${selectedNames.length}`);
  console.log(`Icons written: ${metadata.length}`);
  console.log(`Failures: ${failures.length}`);
  if (failures.length > 0) {
    const preview = failures.slice(0, 20);
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
