import { convertStepper } from '../../src/converter/stepper';

describe('convertStepper', () => {
  it('converts stepper block to <Steps>', () => {
    const input = `{% stepper %}\n{% step %}\nStep one.\n{% endstep %}\n{% step %}\nStep two.\n{% endstep %}\n{% endstepper %}`;
    const result = convertStepper(input);
    expect(result).toContain('<Steps>');
    expect(result).toContain('<Step>');
    expect(result).toContain('Step one.');
    expect(result).toContain('Step two.');
    expect(result).toContain('</Steps>');
  });
});
