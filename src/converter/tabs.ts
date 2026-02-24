// {% tabs %} / {% tab title="..." %} → <Tabs> / <Tab title="...">

export function convertTabs(content: string): string {
  // First convert individual tabs
  let result = content.replace(
    /\{%\s*tab\s+title="([^"]+)"\s*%\}([\s\S]*?)\{%\s*endtab\s*%\}/g,
    (_, title: string, inner: string) => {
      return `<Tab title="${title}">\n${inner.trim()}\n</Tab>`;
    }
  );

  // Then wrap the tabs block
  result = result.replace(
    /\{%\s*tabs\s*%\}([\s\S]*?)\{%\s*endtabs\s*%\}/g,
    (_, inner: string) => {
      return `<Tabs>\n${inner.trim()}\n</Tabs>`;
    }
  );

  return result;
}
