import { readConfigOrDefault } from '../config.js';
import { logger } from '../logger.js';
import { fetchMetadata } from '../registry.js';

export interface SearchOptions {
  categoryOnly?: boolean;
  limit?: number;
}

export const searchIcons = async (cwd: string, query: string, options: SearchOptions = {}): Promise<void> => {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) {
    throw new Error('Search query cannot be empty.');
  }

  const config = await readConfigOrDefault(cwd);
  const metadata = await fetchMetadata(cwd, config);
  const limit = options.limit ?? 20;

  const matches = metadata.icons.filter((entry) => {
    const nameMatch = entry.name.toLowerCase().includes(trimmedQuery);
    const categoryMatch = entry.category?.toLowerCase().includes(trimmedQuery) ?? false;
    const tagsMatch = entry.tags?.some((tag) => tag.toLowerCase().includes(trimmedQuery)) ?? false;

    if (options.categoryOnly) {
      return categoryMatch;
    }

    return nameMatch || categoryMatch || tagsMatch;
  });

  if (matches.length === 0) {
    logger.info(`No icons found for "${query}"`);
    return;
  }

  logger.info(`Found ${matches.length} icons (showing up to ${limit}):`);
  matches.slice(0, limit).forEach((entry) => {
    const meta: string[] = [];
    if (entry.category) {
      meta.push(`category=${entry.category}`);
    }
    if (entry.tags && entry.tags.length > 0) {
      meta.push(`tags=${entry.tags.slice(0, 5).join(',')}`);
    }
    const suffix = meta.length > 0 ? ` (${meta.join(' | ')})` : '';
    logger.info(`- ${entry.name}${suffix}`);
  });
};

