import { readConfigOrDefault } from '../config.js';
import { listInstalledIcons, removeIconComponent, updateBarrelFile } from '../generator.js';
import { logger } from '../logger.js';
import { normalizeIconName } from '../naming.js';

export const removeIcons = async (cwd: string, iconNames: string[]): Promise<void> => {
  if (iconNames.length === 0) {
    throw new Error('No icon names provided. Usage: npx rh-mi remove <icon_name> [icon_name...]');
  }

  const config = await readConfigOrDefault(cwd);
  const installed = new Set(await listInstalledIcons(cwd, config.iconsDir));

  for (const rawName of iconNames) {
    const iconName = normalizeIconName(rawName);
    if (!installed.has(iconName)) {
      logger.warn(`Icon not installed: ${iconName}`);
      continue;
    }

    const removed = await removeIconComponent(cwd, config.iconsDir, iconName);
    if (removed) {
      logger.info(`Removed ${iconName}`);
    }
  }

  await updateBarrelFile(cwd, config.iconsDir);
};

