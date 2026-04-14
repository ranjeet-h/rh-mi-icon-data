import { readConfigOrDefault } from '../config.js';
import { writeIconComponent, updateBarrelFile } from '../generator.js';
import { HttpError } from '../http.js';
import { logger } from '../logger.js';
import { normalizeIconName } from '../naming.js';
import { fetchIconVariant } from '../registry.js';
import type { IconRegistryFile, IconStyle } from '../types.js';

const ALL_STYLES: IconStyle[] = ['rounded', 'outlined', 'sharp'];

export interface AddCommandOptions {
  styles?: IconStyle[];
  allStyles?: boolean;
  quiet?: boolean;
}

const resolveStyles = (options: AddCommandOptions): IconStyle[] => {
  if (options.allStyles) {
    return ALL_STYLES;
  }
  if (options.styles && options.styles.length > 0) {
    return [...new Set(options.styles)];
  }
  return ['rounded'];
};

const isIconStyle = (value: string): value is IconStyle => {
  return value === 'rounded' || value === 'outlined' || value === 'sharp';
};

const fetchStyleData = async (
  cwd: string,
  iconName: string,
  styles: IconStyle[],
  config: Awaited<ReturnType<typeof readConfigOrDefault>>,
): Promise<Partial<Record<IconStyle, IconRegistryFile>>> => {
  const styleData: Partial<Record<IconStyle, IconRegistryFile>> = {};

  for (const style of styles) {
    try {
      styleData[style] = await fetchIconVariant(cwd, config, iconName, style);
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) {
        logger.warn(`Skipping missing style "${style}" for icon "${iconName}"`);
        continue;
      }
      throw error;
    }
  }

  return styleData;
};

export const addIcons = async (cwd: string, iconNames: string[], options: AddCommandOptions = {}): Promise<void> => {
  if (iconNames.length === 0) {
    throw new Error('No icon names provided. Usage: npx rh-mi add <icon_name> [icon_name...]');
  }

  const config = await readConfigOrDefault(cwd);
  const styles = resolveStyles(options);

  for (const rawName of iconNames) {
    const iconName = normalizeIconName(rawName);
    const styleData = await fetchStyleData(cwd, iconName, styles, config);

    if (Object.keys(styleData).length === 0) {
      throw new Error(`No styles available for icon "${iconName}" in ref "${config.registry.ref}"`);
    }

    const target = await writeIconComponent(cwd, config.iconsDir, iconName, styleData);
    if (!options.quiet) {
      logger.info(`Generated ${target}`);
    }
  }

  const barrelPath = await updateBarrelFile(cwd, config.iconsDir);
  if (!options.quiet) {
    logger.info(`Updated exports: ${barrelPath}`);
  }
};

export const parseStyles = (values: string[]): IconStyle[] => {
  return values.map((value) => {
    if (!isIconStyle(value)) {
      throw new Error(`Invalid style value: ${value}. Allowed: rounded, outlined, sharp`);
    }
    return value;
  });
};
