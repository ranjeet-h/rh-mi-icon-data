export type IconStyle = 'rounded' | 'outlined' | 'sharp';
export type FillVariant = 0 | 1;

export interface RegistryConfig {
  owner: string;
  repo: string;
  ref: string;
}

export interface RhMiConfig {
  registry: RegistryConfig;
  iconsDir: string;
  cacheDir?: string;
}

export interface IconRegistryFile {
  name: string;
  style: IconStyle;
  viewBox: string;
  paths: {
    fill0: string;
    fill1: string;
  };
  category?: string;
  tags?: string[];
}

export interface MetadataEntry {
  name: string;
  category?: string;
  tags?: string[];
}

export interface MetadataFile {
  icons: MetadataEntry[];
}

