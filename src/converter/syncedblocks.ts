import { MigrationFlag } from '../types';

// Synced blocks — inline content and flag for manual review

export function convertSyncedBlocks(content: string, flags: MigrationFlag[]): string {
  // GitBook synced blocks appear as special comments or tags
  return content.replace(
    /\{%\s*@?synced\s*(?:block)?\s*(?:src="[^"]*")?\s*%\}([\s\S]*?)\{%\s*end@?synced\s*(?:block)?\s*%\}/g,
    (_, inner: string) => {
      flags.push({ type: 'synced-block', message: 'Synced block inlined — manual review needed' });
      return `${inner.trim()}\n<!-- synced block: manual review needed -->`;
    }
  );
}
