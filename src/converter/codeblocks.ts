// {% code title="..." %} ... {% endcode %} → ```lang title="..."

export function convertCodeBlocks(content: string): string {
  return content.replace(
    /\{%\s*code\s*(?:title="([^"]*)")?(?:\s+overflow="\w+")?(?:\s+lineNumbers="\w+")?\s*%\}\n?```(\w*)\n([\s\S]*?)```\n?\{%\s*endcode\s*%\}/g,
    (_, title: string | undefined, lang: string, code: string) => {
      const titleAttr = title ? ` title="${title}"` : '';
      return `\`\`\`${lang}${titleAttr}\n${code}\`\`\``;
    }
  );
}
