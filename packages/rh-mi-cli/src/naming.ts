const SEGMENT_SEPARATOR = /[_\-\s]+/g;

export const normalizeIconName = (input: string): string => {
  return input
    .trim()
    .toLowerCase()
    .replace(SEGMENT_SEPARATOR, '_')
    .replace(/[^a-z0-9_]/g, '');
};

export const toPascalCase = (input: string): string => {
  return normalizeIconName(input)
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
};

export const pascalToSnake = (input: string): string => {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/__+/g, '_');
};

