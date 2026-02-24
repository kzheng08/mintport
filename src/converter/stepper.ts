// {% stepper %} / {% step %} → <Steps> / <Step>

export function convertStepper(content: string): string {
  let result = content.replace(
    /\{%\s*step\s*%\}([\s\S]*?)\{%\s*endstep\s*%\}/g,
    (_, inner: string) => {
      return `<Step>\n${inner.trim()}\n</Step>`;
    }
  );

  result = result.replace(
    /\{%\s*stepper\s*%\}([\s\S]*?)\{%\s*endstepper\s*%\}/g,
    (_, inner: string) => {
      return `<Steps>\n${inner.trim()}\n</Steps>`;
    }
  );

  return result;
}
