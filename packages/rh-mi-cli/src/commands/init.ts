import { access, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { configPathFor, ensureDirectory, getDefaultConfig, readConfigOrDefault, writeConfig } from '../config.js';
import { updateBarrelFile } from '../generator.js';
import { logger } from '../logger.js';

export const initCommand = async (cwd: string): Promise<void> => {
  const configPath = configPathFor(cwd);
  const config = getDefaultConfig();

  try {
    await access(configPath);
    logger.info(`Config already exists: ${configPath}`);
  } catch {
    await writeConfig(cwd, config);
    logger.info(`Created config: ${configPath}`);
  }

  const resolvedConfig = await readConfigOrDefault(cwd);
  const iconsDir = await ensureDirectory(cwd, resolvedConfig.iconsDir);
  const barrelPath = await updateBarrelFile(cwd, resolvedConfig.iconsDir);

  const readmePath = path.join(iconsDir, 'README.txt');
  try {
    await access(readmePath);
  } catch {
    await writeFile(
      readmePath,
      'This folder is generated/managed by rh-mi-cli. Do not hand-edit generated icon files.\n',
      'utf8',
    );
  }

  logger.info(`Initialized icons directory: ${iconsDir}`);
  logger.info(`Initialized barrel file: ${barrelPath}`);
};

