import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchJson } from './http.js';
import type { IconRegistryFile, IconStyle, MetadataFile, RhMiConfig } from './types.js';

const readLocalRegistryJson = async <T>(cwd: string, segments: string[]): Promise<T | null> => {
  const localPath = path.resolve(cwd, 'registry', ...segments);
  try {
    const raw = await readFile(localPath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

const cacheFilePath = (cwd: string, config: RhMiConfig, segments: string[]): string => {
  const cacheRoot = config.cacheDir ?? '.cache/rh-mi';
  return path.resolve(cwd, cacheRoot, config.registry.ref, ...segments);
};

const readFromCache = async <T>(filePath: string): Promise<T | null> => {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const writeToCache = async <T>(filePath: string, value: T): Promise<void> => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value)}\n`, 'utf8');
};

const cdnBaseUrl = (config: RhMiConfig): string => {
  const { owner, repo, ref } = config.registry;
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${ref}`;
};

export const registryIconUrl = (config: RhMiConfig, style: IconStyle, iconName: string): string => {
  return `${cdnBaseUrl(config)}/registry/${style}/${iconName}.json`;
};

export const metadataUrl = (config: RhMiConfig): string => {
  return `${cdnBaseUrl(config)}/registry/metadata.json`;
};

export const fetchIconVariant = async (
  cwd: string,
  config: RhMiConfig,
  iconName: string,
  style: IconStyle,
): Promise<IconRegistryFile> => {
  const local = await readLocalRegistryJson<IconRegistryFile>(cwd, [style, `${iconName}.json`]);
  if (local) {
    return local;
  }

  const cachePath = cacheFilePath(cwd, config, ['registry', style, `${iconName}.json`]);
  const cached = await readFromCache<IconRegistryFile>(cachePath);
  if (cached) {
    return cached;
  }

  const url = registryIconUrl(config, style, iconName);
  const data = await fetchJson<IconRegistryFile>(url);
  await writeToCache(cachePath, data);
  return data;
};

export const fetchMetadata = async (cwd: string, config: RhMiConfig): Promise<MetadataFile> => {
  const local = await readLocalRegistryJson<MetadataFile>(cwd, ['metadata.json']);
  if (local) {
    return local;
  }

  const cachePath = cacheFilePath(cwd, config, ['registry', 'metadata.json']);
  const cached = await readFromCache<MetadataFile>(cachePath);
  if (cached) {
    return cached;
  }

  const url = metadataUrl(config);
  const data = await fetchJson<MetadataFile>(url);
  await writeToCache(cachePath, data);
  return data;
};
