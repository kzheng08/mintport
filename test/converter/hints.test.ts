import { convertHints } from '../../src/converter/hints';

describe('convertHints', () => {
  it('converts info hint to <Note>', () => {
    const input = `{% hint style="info" %}\nThis is info.\n{% endhint %}`;
    expect(convertHints(input)).toBe('<Note>\nThis is info.\n</Note>');
  });

  it('converts warning hint to <Warning>', () => {
    const input = `{% hint style="warning" %}\nBe careful.\n{% endhint %}`;
    expect(convertHints(input)).toBe('<Warning>\nBe careful.\n</Warning>');
  });

  it('converts danger hint to <Warning>', () => {
    const input = `{% hint style="danger" %}\nDanger!\n{% endhint %}`;
    expect(convertHints(input)).toBe('<Warning>\nDanger!\n</Warning>');
  });

  it('converts success hint to <Check>', () => {
    const input = `{% hint style="success" %}\nAll good.\n{% endhint %}`;
    expect(convertHints(input)).toBe('<Check>\nAll good.\n</Check>');
  });

  it('leaves non-hint content untouched', () => {
    const input = 'Just regular text.';
    expect(convertHints(input)).toBe('Just regular text.');
  });

  it('handles multiple hints in one document', () => {
    const input = `{% hint style="info" %}\nFirst.\n{% endhint %}\n\n{% hint style="warning" %}\nSecond.\n{% endhint %}`;
    const result = convertHints(input);
    expect(result).toContain('<Note>\nFirst.\n</Note>');
    expect(result).toContain('<Warning>\nSecond.\n</Warning>');
  });
});
