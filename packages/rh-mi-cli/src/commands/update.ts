import { addIcons } from './add.js';
import { readConfigOrDefault } from '../config.js';
import { listInstalledIcons } from '../generator.js';
import { logger } from '../logger.js';

export interface UpdateOptions {
  allStyles?: boolean;
}

export const updateIcons = async (cwd: string, iconNames: string[], options: UpdateOptions = {}): Promise<void> => {
  const config = await readConfigOrDefault(cwd);
  const targets = iconNames.length > 0 ? iconNames : await listInstalledIcons(cwd, config.iconsDir);

  if (targets.length === 0) {
    logger.info('No icons to update.');
    return;
  }

  await addIcons(cwd, targets, { allStyles: options.allStyles ?? true });
  logger.info(`Updated ${targets.length} icon(s).`);
};

