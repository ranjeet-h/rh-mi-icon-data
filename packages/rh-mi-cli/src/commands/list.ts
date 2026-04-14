import { readConfigOrDefault } from '../config.js';
import { listInstalledIcons } from '../generator.js';
import { logger } from '../logger.js';

export const listIcons = async (cwd: string): Promise<void> => {
  const config = await readConfigOrDefault(cwd);
  const icons = await listInstalledIcons(cwd, config.iconsDir);

  if (icons.length === 0) {
    logger.info('No icons installed yet.');
    return;
  }

  logger.info(`Installed icons (${icons.length}):`);
  icons.forEach((icon) => logger.info(`- ${icon}`));
};

