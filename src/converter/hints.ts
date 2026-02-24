// {% hint style="info" %} ... {% endhint %} → <Note>, <Warning>, <Check>, <Tip>

const STYLE_MAP: Record<string, string> = {
  info: 'Note',
  warning: 'Warning',
  danger: 'Warning',
  success: 'Check',
  tip: 'Tip',
};

export function convertHints(content: string): string {
  return content.replace(
    /\{%\s*hint\s+style="(\w+)"\s*%\}([\s\S]*?)\{%\s*endhint\s*%\}/g,
    (_, style: string, inner: string) => {
      const component = STYLE_MAP[style.toLowerCase()] ?? 'Note';
      return `<${component}>\n${inner.trim()}\n</${component}>`;
    }
  );
}
