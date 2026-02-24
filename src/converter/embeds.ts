import { MigrationFlag } from '../types';

// {% embed url="..." %} → markdown link + flag

export function convertEmbeds(content: string, flags: MigrationFlag[]): string {
  return content.replace(
    /\{%\s*embed\s+url="([^"]+)"\s*%\}/g,
    (_, url: string) => {
      flags.push({ type: 'embed', message: `Embed converted to link: ${url}` });
      return `[${url}](${url})\n<!-- embed: manual review needed -->`;
    }
  );
}
