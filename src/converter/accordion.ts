// {% accordion %} → <Accordion>

export function convertAccordion(content: string): string {
  return content.replace(
    /\{%\s*accordion\s*(?:title="([^"]*)")?\s*%\}([\s\S]*?)\{%\s*endaccordion\s*%\}/g,
    (_, title: string | undefined, inner: string) => {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<Accordion${titleAttr}>\n${inner.trim()}\n</Accordion>`;
    }
  );
}
