import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RhMiConfig } from './types.js';

export const CONFIG_FILE_NAME = 'rh-mi.config.json';

const DEFAULT_CONFIG: RhMiConfig = {
  registry: {
    owner: 'ranjeet-h',
    repo: 'rh-mi-icon-data',
    ref: 'v1.2.0',
  },
  iconsDir: 'src/icons',
  cacheDir: '.cache/rh-mi',
};

const mergeConfig = (input: Partial<RhMiConfig>): RhMiConfig => {
  return {
    registry: {
      owner: input.registry?.owner ?? DEFAULT_CONFIG.registry.owner,
      repo: input.registry?.repo ?? DEFAULT_CONFIG.registry.repo,
      ref: input.registry?.ref ?? DEFAULT_CONFIG.registry.ref,
    },
    iconsDir: input.iconsDir ?? DEFAULT_CONFIG.iconsDir,
    cacheDir: input.cacheDir ?? DEFAULT_CONFIG.cacheDir,
  };
};

export const configPathFor = (cwd: string): string => path.join(cwd, CONFIG_FILE_NAME);

export const getDefaultConfig = (): RhMiConfig => ({ ...DEFAULT_CONFIG, registry: { ...DEFAULT_CONFIG.registry } });

export const readConfig = async (cwd: string): Promise<RhMiConfig> => {
  const filePath = configPathFor(cwd);
  const raw = await readFile(filePath, 'utf8');
  let parsed: Partial<RhMiConfig>;
  try {
    parsed = JSON.parse(raw) as Partial<RhMiConfig>;
  } catch {
    throw new Error(`Invalid JSON in config file: ${filePath}`);
  }
  return mergeConfig(parsed);
};

export const readConfigOrDefault = async (cwd: string): Promise<RhMiConfig> => {
  const filePath = configPathFor(cwd);
  try {
    await access(filePath);
    return await readConfig(cwd);
  } catch {
    return getDefaultConfig();
  }
};

export const writeConfig = async (cwd: string, config: RhMiConfig): Promise<string> => {
  const filePath = configPathFor(cwd);
  await writeFile(filePath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return filePath;
};

export const ensureDirectory = async (cwd: string, relativeDir: string): Promise<string> => {
  const absolutePath = path.resolve(cwd, relativeDir);
  await mkdir(absolutePath, { recursive: true });
  return absolutePath;
};
