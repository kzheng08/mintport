// Post-process MDX content to fix issues that break Mintlify's MDX parser

const SAFE_COMPONENTS = new Set([
  'Note', 'Warning', 'Check', 'Tip', 'Info',
  'Tabs', 'Tab', 'Steps', 'Step', 'Accordion',
  'Frame', 'Card', 'CardGroup', 'CodeGroup',
]);

export function sanitizeMdx(content: string): string {
  let result = content;

  // 1. Convert <pre><code> HTML code blocks to markdown fences FIRST
  result = result.replace(
    /<pre[^>]*>\s*<code(?:\s+class="lang-(\w+)")?[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/g,
    (_, lang = '', code: string) => {
      const clean = code
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        .replace(/&#x3C;/g, '<').replace(/&#x3E;/g, '>').replace(/<[^>]+>/g, '');
      return `\`\`\`${lang}\n${clean.trim()}\n\`\`\``;
    }
  );

  // 2. Protect code blocks and inline code from further processing
  const codeBlocks: string[] = [];
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `\x00CODE${codeBlocks.length - 1}\x00`;
  });
  // Protect inline code — including multi-line backtick pairs in tables (` ... \n ... `)
  result = result.replace(/`[^`]+`/g, (match) => {
    // Strip embedded < > that look like JSX tags inside inline code in tables
    const safe = match.replace(/<([A-Z][a-zA-Z]*)>/g, '&lt;$1&gt;').replace(/<\/([A-Z][a-zA-Z]*)>/g, '&lt;/$1&gt;');
    codeBlocks.push(safe);
    return `\x00CODE${codeBlocks.length - 1}\x00`;
  });

  // 3. Convert <figure>/<picture> image wrappers to markdown images
  result = result.replace(
    /<figure>\s*<img\s+src="([^"]+)"(?:\s+alt="([^"]*)")?\s*[^>]*\/?>\s*(?:<figcaption>[\s\S]*?<\/figcaption>)?\s*<\/figure>/g,
    (_, src: string, alt = '') => `![${alt}](${src})`
  );
  result = result.replace(
    /<picture>\s*(?:<source[^>]*\/?>\s*)*<img\s+src="([^"]+)"(?:\s+alt="([^"]*)")?\s*[^>]*\/?>\s*<\/picture>/g,
    (_, src: string, alt = '') => `![${alt}](${src})`
  );

  // 4. Self-close void HTML elements
  result = result.replace(/<br(\s[^>]*)?\s*(?!\/)>/g, '<br />');
  result = result.replace(/<hr(\s[^>]*)?\s*(?!\/)>/g, '<hr />');
  result = result.replace(/<img(\s[^>]*?)?\s*(?!\/)>/g, (_, attrs = '') => `<img${attrs} />`);

  // 5. Strip <div> wrappers, keep inner content
  result = result.replace(/<div[^>]*>([\s\S]*?)<\/div>/g, (_, inner: string) => inner.trim());

  // 6. Strip GitBook heading anchors — <a href="#..." id="..."></a> with no text content
  result = result.replace(/<a\s+[^>]*>\s*<\/a>/g, '');

  // Convert inline HTML to markdown (single-line only to avoid wrapping MDX components)
  result = result.replace(/<strong>([^<\n]*?)<\/strong>/g, '**$1**');
  result = result.replace(/<b>([^<\n]*?)<\/b>/g, '**$1**');
  result = result.replace(/<em>([^<\n]*?)<\/em>/g, '_$1_');
  result = result.replace(/<i>([^<\n]*?)<\/i>/g, '_$1_');
  result = result.replace(/<code>([^<\n]*?)<\/code>/g, '`$1`');
  result = result.replace(/<a\s+href="([^"]+)"[^>]*>([^<\n]+?)<\/a>/g, '[$2]($1)');
  result = result.replace(/<\/?(strong|b|em|i|code|a)(\s[^>]*)?>/g, '');

  // 7. Handle {% columns %} blocks — convert to simple line-separated sections
  //    Note: column tags may have attributes like width="50%" so we use a permissive match
  result = result.replace(
    /\{%\s*columns\s*%\}([\s\S]*?)\{%\s*endcolumns\s*%\}/g,
    (_, inner: string) => {
      return inner
        .replace(/\{%-?\s*column[^%]*(?:%(?!})[^%]*)*%\}/g, '\n---\n')
        .replace(/\{%-?\s*endcolumn\s*-?%\}/g, '')
        .trim();
    }
  );

  // 8. Comment out any remaining unconverted {% ... %} GitBook tags
  //    Use permissive match that allows % inside attributes (e.g. width="50%")
  result = result.replace(
    /\{%-?[\s\S]*?-?%\}/g,
    (match) => `{/* gitbook: ${match.slice(2, 60).trim().replace(/\*\//g, '')} */}`
  );

  // 9. Strip remaining unknown HTML tags (keep our MDX components and void elements)
  result = result.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tag: string) => {
    if (SAFE_COMPONENTS.has(tag)) return match;
    if (['br', 'hr', 'img'].includes(tag.toLowerCase())) return match;
    return '';
  });

  // 10. HTML comments → MDX comments
  result = result.replace(/<!--([\s\S]*?)-->/g, (_, inner: string) => `{/* ${inner.trim()} */}`);

  // 11. Escape stray { that MDX would try to parse as JSX (but not {/* comments */ or \\{ already escaped)
  result = result.replace(/(?<!\\)\{(?![/%*\s])/g, '\\{');

  // Restore code blocks
  result = result.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeBlocks[parseInt(i)]);

  return result;
}
