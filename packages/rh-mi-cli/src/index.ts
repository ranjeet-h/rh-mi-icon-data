#!/usr/bin/env node

import { addIcons, parseStyles } from './commands/add.js';
import { initCommand } from './commands/init.js';
import { listIcons } from './commands/list.js';
import { removeIcons } from './commands/remove.js';
import { searchIcons } from './commands/search.js';
import { updateIcons } from './commands/update.js';
import { logger } from './logger.js';

const cwd = process.cwd();

const helpText = `rh-mi - on-demand Material Symbol icon generator

Usage:
  rh-mi init
  rh-mi add <icon_name> [icon_name...] [--style=<rounded|outlined|sharp>] [--all-styles]
  rh-mi remove <icon_name> [icon_name...]
  rh-mi list
  rh-mi search <query> [--category]
  rh-mi update [icon_name...]
`;

const consumeOptionValue = (args: string[], currentIndex: number): [value: string, nextIndex: number] => {
  const arg = args[currentIndex];
  const [key, inlineValue] = arg.split('=');
  if (inlineValue !== undefined && inlineValue.length > 0) {
    return [inlineValue, currentIndex];
  }

  const next = args[currentIndex + 1];
  if (!next || next.startsWith('--')) {
    throw new Error(`Missing value for ${key}`);
  }
  return [next, currentIndex + 1];
};

const parseAddArgs = (args: string[]): { icons: string[]; styles: string[]; allStyles: boolean } => {
  const icons: string[] = [];
  const styles: string[] = [];
  let allStyles = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--all-styles') {
      allStyles = true;
      continue;
    }

    if (arg.startsWith('--style')) {
      const [style, newIndex] = consumeOptionValue(args, index);
      styles.push(style);
      index = newIndex;
      continue;
    }

    icons.push(arg);
  }

  return { icons, styles, allStyles };
};

const parseSearchArgs = (args: string[]): { query: string; categoryOnly: boolean } => {
  const querySegments: string[] = [];
  let categoryOnly = false;

  for (const arg of args) {
    if (arg === '--category') {
      categoryOnly = true;
      continue;
    }
    querySegments.push(arg);
  }

  return { query: querySegments.join(' '), categoryOnly };
};

const main = async (): Promise<void> => {
  const [command = 'help', ...args] = process.argv.slice(2);

  switch (command) {
    case 'help':
    case '--help':
    case '-h': {
      logger.info(helpText);
      return;
    }
    case 'init': {
      await initCommand(cwd);
      return;
    }
    case 'add': {
      const parsed = parseAddArgs(args);
      const styles = parseStyles(parsed.styles);
      await addIcons(cwd, parsed.icons, { styles, allStyles: parsed.allStyles });
      return;
    }
    case 'remove': {
      await removeIcons(cwd, args);
      return;
    }
    case 'list': {
      await listIcons(cwd);
      return;
    }
    case 'search': {
      const parsed = parseSearchArgs(args);
      await searchIcons(cwd, parsed.query, { categoryOnly: parsed.categoryOnly });
      return;
    }
    case 'update': {
      await updateIcons(cwd, args, { allStyles: true });
      return;
    }
    default: {
      throw new Error(`Unknown command "${command}". Use "rh-mi help" for usage.`);
    }
  }
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(`rh-mi error: ${message}`);
  process.exitCode = 1;
});

