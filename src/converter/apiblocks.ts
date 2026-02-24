import { MigrationFlag } from '../types';

// API blocks — flag for QA, do not auto-convert

export function convertApiBlocks(content: string, flags: MigrationFlag[]): string {
  return content.replace(
    /\{%\s*swagger\s*[\s\S]*?\{%\s*endswagger\s*%\}/g,
    (match) => {
      flags.push({ type: 'api-block', message: 'API/Swagger block requires manual conversion' });
      return `<!-- api-block: manual conversion needed\n${match}\n-->`;
    }
  );
}
