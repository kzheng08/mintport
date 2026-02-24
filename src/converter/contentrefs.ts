import * as path from 'path';
import { MigrationFlag } from '../types';

// {% content-ref url="..." %} → [title](mintlify-path)

export function convertContentRefs(
  content: string,
  pagePath: string,
  allPaths: string[],
  flags: MigrationFlag[]
): string {
  const pageDir = path.dirname(pagePath);

  return content.replace(
    /\{%\s*content-ref\s+url="([^"]+)"\s*%\}[\s\S]*?\{%\s*endcontent-ref\s*%\}/g,
    (_, url: string) => {
      // Resolve relative URLs against the current page's directory
      const resolved = url.startsWith('/')
        ? url
        : path.join(pageDir, url).replace(/\\/g, '/');

      const resolvedNoExt = resolved.replace(/\.md$/, '');
      const exists = allPaths.some(p => p.replace(/\.md$/, '') === resolvedNoExt || p === resolved);

      if (!exists) {
        flags.push({ type: 'broken-link', message: `content-ref target not found: ${url}` });
      }

      const linkPath = resolvedNoExt.startsWith('/') ? resolvedNoExt : `/${resolvedNoExt}`;
      return `[${path.basename(resolvedNoExt)}](${linkPath})`;
    }
  );
}
