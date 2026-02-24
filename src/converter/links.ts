// Rewrite .md links to Mintlify path format (no extension, absolute)

export function rewriteLinks(content: string, currentFilePath: string): string {
  return content.replace(
    /\[([^\]]+)\]\(([^)]+\.md(?:#[^)]*)?)\)/g,
    (_, text: string, href: string) => {
      const [filePart, anchor] = href.split('#');
      const withoutExt = filePart.replace(/\.md$/, '');
      const anchorStr = anchor ? `#${anchor}` : '';
      // Make path absolute-ish (Mintlify uses root-relative paths)
      const resolved = withoutExt.startsWith('.')
        ? withoutExt  // keep relative for now — output/pages.ts resolves
        : withoutExt;
      return `[${text}](${resolved}${anchorStr})`;
    }
  );
}
