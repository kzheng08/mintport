import * as fs from 'fs-extra';
import * as path from 'path';
import { ParsedPage } from '../types';

function buildFrontmatter(title: string, description: string): string {
  return `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndescription: "${description.replace(/"/g, '\\"')}"\n---\n\n`;
}

export async function writePage(
  page: ParsedPage,
  outputDir: string,
  dryRun: boolean,
  verbose: boolean
): Promise<void> {
  const outputPath = path.join(outputDir, page.outputPath);
  const dir = path.dirname(outputPath);
  const frontmatter = buildFrontmatter(page.title, page.description);
  const fileContent = frontmatter + page.content;

  if (dryRun) {
    if (verbose) console.log(`[dry-run] Would write page: ${outputPath}`);
    return;
  }

  await fs.ensureDir(dir);
  await fs.writeFile(outputPath, fileContent, 'utf-8');

  if (verbose) console.log(`  Wrote: ${outputPath}`);
}
