import { convertAccordion } from '../../src/converter/accordion';

describe('convertAccordion', () => {
  it('converts accordion with a title', () => {
    const input = `{% accordion title="FAQ" %}\nSome content.\n{% endaccordion %}`;
    const result = convertAccordion(input);
    expect(result).toContain('<Accordion title="FAQ">');
    expect(result).toContain('Some content.');
    expect(result).toContain('</Accordion>');
  });

  it('converts accordion without a title', () => {
    const input = `{% accordion %}\nSome content.\n{% endaccordion %}`;
    const result = convertAccordion(input);
    expect(result).toContain('<Accordion>');
    expect(result).toContain('</Accordion>');
  });
});
