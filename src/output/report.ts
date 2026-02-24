import * as fs from 'fs-extra';
import * as path from 'path';
import { MigrationReport } from '../types';

export function buildReport(report: MigrationReport): string {
  const lines: string[] = [
    '# Migration Report',
    '',
    `**Total pages found:** ${report.totalPages}`,
    `**Pages converted:** ${report.convertedPages}`,
    `**Pages failed:** ${report.failedPages.length}`,
    '',
  ];

  if (report.flaggedPages.length > 0) {
    lines.push('## Pages Requiring Manual Review', '');
    for (const { path: p, flags } of report.flaggedPages) {
      lines.push(`### \`${p}\``);
      for (const f of flags) {
        lines.push(`- **${f.type}**: ${f.message}`);
      }
      lines.push('');
    }
  }

  if (report.brokenLinks.length > 0) {
    lines.push('## Broken Internal Links', '');
    for (const link of report.brokenLinks) {
      lines.push(`- ${link}`);
    }
    lines.push('');
  }

  lines.push('## Branding', '');
  if (report.brandingAutoDetected.length > 0) {
    lines.push('**Auto-detected:**');
    for (const field of report.brandingAutoDetected) lines.push(`- ${field}`);
    lines.push('');
  }
  if (report.brandingNeedsManualInput.length > 0) {
    lines.push('**Manually entered (verify these):**');
    for (const field of report.brandingNeedsManualInput) lines.push(`- ${field}`);
    lines.push('');
  }

  if (report.failedPages.length > 0) {
    lines.push('## Failed Pages', '');
    for (const p of report.failedPages) lines.push(`- ${p}`);
    lines.push('');
  }

  return lines.join('\n');
}

export async function writeReport(
  report: MigrationReport,
  outputDir: string,
  dryRun: boolean
): Promise<void> {
  const content = buildReport(report);
  const filePath = path.join(outputDir, '_migration_report.md');

  if (dryRun) {
    console.log(`[dry-run] Would write report: ${filePath}`);
    return;
  }

  await fs.ensureDir(outputDir);
  await fs.writeFile(filePath, content, 'utf-8');
}
