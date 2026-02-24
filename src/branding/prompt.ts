import inquirer, { DistinctQuestion } from 'inquirer';
import { Branding } from '../types';

const DEFAULTS: Required<Branding> = {
  name: 'My Docs',
  primaryColor: '#0066CC',
  logoLight: '/images/logo-light.png',
  logoDark: '/images/logo-dark.png',
  favicon: '/images/favicon.png',
};

export async function promptMissingBranding(partial: Partial<Branding>): Promise<Branding> {
  // In non-interactive environments, fall back to defaults silently
  if (!process.stdin.isTTY) {
    const missing = Object.keys(DEFAULTS).filter(k => !partial[k as keyof Branding]);
    if (missing.length > 0) {
      console.log(`  [branding] Non-interactive mode — using defaults for: ${missing.join(', ')}`);
      console.log('  Edit mint.json after conversion to set your real branding.');
    }
    return { ...DEFAULTS, ...partial } as Branding;
  }

  const questions: DistinctQuestion[] = [];

  if (!partial.name) {
    questions.push({ type: 'input', name: 'name', message: 'What is your documentation site name?', default: DEFAULTS.name });
  }
  if (!partial.primaryColor) {
    questions.push({ type: 'input', name: 'primaryColor', message: 'Primary brand color (hex):', default: DEFAULTS.primaryColor });
  }
  if (!partial.logoLight) {
    questions.push({ type: 'input', name: 'logoLight', message: 'Path or URL to light mode logo:', default: DEFAULTS.logoLight });
  }
  if (!partial.logoDark) {
    questions.push({ type: 'input', name: 'logoDark', message: 'Path or URL to dark mode logo:', default: DEFAULTS.logoDark });
  }
  if (!partial.favicon) {
    questions.push({ type: 'input', name: 'favicon', message: 'Path or URL to favicon:', default: DEFAULTS.favicon });
  }

  const answers = questions.length > 0 ? await inquirer.prompt(questions) : {};

  return {
    name: partial.name ?? answers.name,
    primaryColor: partial.primaryColor ?? answers.primaryColor,
    logoLight: partial.logoLight ?? answers.logoLight,
    logoDark: partial.logoDark ?? answers.logoDark,
    favicon: partial.favicon ?? answers.favicon,
  };
}
