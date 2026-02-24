import { convertTabs } from '../../src/converter/tabs';

describe('convertTabs', () => {
  it('converts a tabs block with two tabs', () => {
    const input = `{% tabs %}\n{% tab title="npm" %}\nnpm install\n{% endtab %}\n{% tab title="yarn" %}\nyarn add\n{% endtab %}\n{% endtabs %}`;
    const result = convertTabs(input);
    expect(result).toContain('<Tabs>');
    expect(result).toContain('<Tab title="npm">');
    expect(result).toContain('<Tab title="yarn">');
    expect(result).toContain('</Tabs>');
  });

  it('leaves content outside tabs untouched', () => {
    const input = 'Regular text';
    expect(convertTabs(input)).toBe('Regular text');
  });
});
