import * as fs from 'fs-extra';
import * as path from 'path';
import { Branding, MintConfig, NavGroup, SummaryGroup, SummaryPage } from '../types';

function pageToPath(page: SummaryPage): string | NavGroup {
  const p = page.path.replace(/\.md$/, '').replace(/^\//, '');

  if (page.children.length > 0) {
    return {
      group: page.title,
      pages: page.children.map(pageToPath),
    };
  }

  return p;
}

export function buildMintConfig(
  groups: SummaryGroup[],
  branding: Branding
): MintConfig {
  const navigation: NavGroup[] = groups.map(group => ({
    group: group.group,
    pages: group.pages.map(pageToPath),
  }));

  return {
    name: branding.name,
    logo: { light: branding.logoLight, dark: branding.logoDark },
    favicon: branding.favicon,
    colors: {
      primary: branding.primaryColor,
    },
    navigation,
  };
}

export async function writeMintConfig(
  config: MintConfig,
  outputDir: string,
  dryRun: boolean
): Promise<void> {
  const filePath = path.join(outputDir, 'mint.json');
  const content = JSON.stringify(config, null, 2);

  if (dryRun) {
    console.log(`[dry-run] Would write: ${filePath}`);
    console.log(content);
    return;
  }

  await fs.ensureDir(outputDir);
  await fs.writeFile(filePath, content, 'utf-8');
}
