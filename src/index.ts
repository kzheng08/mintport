#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import { parseSummary, getAllPages } from './parser/summary';
import { extractZip } from './parser/zip';
import { convertPage } from './converter/index';
import { detectBrandingFromUrl } from './branding/detect';
import { promptMissingBranding } from './branding/prompt';
import { buildMintConfig, writeMintConfig } from './output/mint-json';
import { writePage } from './output/pages';
import { copyAssets } from './output/assets';
import { writeReport } from './output/report';
import { scrapeGitBook } from './scraper/gitbook';
import { ConvertOptions, MigrationReport, MigrationFlag } from './types';

const program = new Command();

program
  .name('mintport')
  .description('Migrate GitBook documentation to Mintlify')
  .version('1.0.0');

program
  .command('convert <input>')
  .description('Convert a GitBook export (directory, .zip, or URL) to Mintlify format')
  .requiredOption('-o, --output <dir>', 'Output directory')
  .option('--dry-run', 'Preview what would be generated without writing files', false)
  .option('--verbose', 'Enable detailed logging', false)
  .action(async (input: string, options: { output: string; dryRun: boolean; verbose: boolean }) => {
    const opts: ConvertOptions = {
      input,
      output: options.output,
      dryRun: options.dryRun,
      verbose: options.verbose,
    };

    try {
      await run(opts);
    } catch (err) {
      console.error('Error:', (err as Error).message);
      process.exit(1);
    }
  });

program.parse(process.argv);

async function run(opts: ConvertOptions): Promise<void> {
  const { input, output, dryRun, verbose } = opts;

  if (dryRun) console.log('Running in dry-run mode — no files will be written.\n');

  // 1. Resolve input to a local directory
  let sourceDir: string;
  let gitbookUrl: string | null = null;

  if (input.startsWith('http://') || input.startsWith('https://')) {
    gitbookUrl = input;
    console.log('Input detected as URL — scraping GitBook site...');
    sourceDir = await scrapeGitBook(input);
  } else if (input.endsWith('.zip')) {
    console.log('Input detected as .zip — extracting...');
    const tmpDir = path.join(output, '.mintport-tmp');
    sourceDir = await extractZip(input, tmpDir);
  } else {
    sourceDir = path.resolve(input);
    if (!await fs.pathExists(sourceDir)) {
      throw new Error(`Input directory not found: ${sourceDir}`);
    }
  }

  if (verbose) console.log(`Source directory: ${sourceDir}`);

  // 2. Parse SUMMARY.md
  const summaryPath = path.join(sourceDir, 'SUMMARY.md');
  if (!await fs.pathExists(summaryPath)) {
    throw new Error(`SUMMARY.md not found in: ${sourceDir}`);
  }

  console.log('Parsing SUMMARY.md...');
  const groups = parseSummary(summaryPath);
  const allPages = getAllPages(groups);
  const allPaths = allPages.map(p => p.path);

  if (verbose) console.log(`Found ${allPages.length} pages across ${groups.length} groups`);

  // 3. Detect branding
  console.log('Detecting branding...');
  let detectedBranding = gitbookUrl ? await detectBrandingFromUrl(gitbookUrl) : {};

  // Try to read title from GitBook config if available
  const gitbookConfigPath = path.join(sourceDir, '.gitbook.yaml');
  if (await fs.pathExists(gitbookConfigPath)) {
    const configContent = await fs.readFile(gitbookConfigPath, 'utf-8');
    const titleMatch = configContent.match(/title:\s*(.+)/);
    if (titleMatch && !detectedBranding.name) {
      detectedBranding.name = titleMatch[1].trim();
    }
  }

  const brandingAutoDetected = Object.keys(detectedBranding);
  const branding = await promptMissingBranding(detectedBranding);
  const brandingNeedsManualInput = ['name', 'primaryColor', 'logoLight', 'logoDark', 'favicon']
    .filter(k => !brandingAutoDetected.includes(k));

  // 4. Convert pages
  console.log(`\nConverting ${allPages.length} pages...`);
  const report: MigrationReport = {
    totalPages: allPages.length,
    convertedPages: 0,
    flaggedPages: [],
    brokenLinks: [],
    brandingAutoDetected,
    brandingNeedsManualInput,
    failedPages: [],
  };

  const allImages: string[] = [];

  for (const page of allPages) {
    const srcPath = path.join(sourceDir, page.path);

    if (!await fs.pathExists(srcPath)) {
      console.warn(`  [warn] Page file not found: ${srcPath}`);
      report.failedPages.push(page.path);
      continue;
    }

    try {
      const rawContent = await fs.readFile(srcPath, 'utf-8');
      const outputPath = page.path.replace(/\.md$/, '.mdx');
      const parsed = convertPage(rawContent, page.path, outputPath, allPaths, sourceDir);

      await writePage(parsed, output, dryRun, verbose);

      if (parsed.flags.length > 0) {
        report.flaggedPages.push({ path: page.path, flags: parsed.flags });
        const brokenLinks = parsed.flags
          .filter(f => f.type === 'broken-link')
          .map(f => f.message);
        report.brokenLinks.push(...brokenLinks);
      }

      allImages.push(...parsed.images);
      report.convertedPages++;

      if (verbose) console.log(`  Converted: ${page.path}`);
    } catch (err) {
      console.warn(`  [error] Failed to convert: ${page.path} — ${(err as Error).message}`);
      report.failedPages.push(page.path);
    }
  }

  // 5. Copy assets
  if (allImages.length > 0) {
    console.log(`\nCopying ${allImages.length} image(s)...`);
    const uniqueImages = [...new Set(allImages)];
    await copyAssets(uniqueImages, sourceDir, output, dryRun, verbose);
  }

  // 6. Write mint.json
  console.log('\nGenerating mint.json...');
  const mintConfig = buildMintConfig(groups, branding);
  await writeMintConfig(mintConfig, output, dryRun);

  // 7. Write report
  console.log('Writing migration report...');
  await writeReport(report, output, dryRun);

  // 8. Summary
  console.log('\n✓ Migration complete!');
  console.log(`  Pages converted: ${report.convertedPages}/${report.totalPages}`);
  if (report.flaggedPages.length > 0) {
    console.log(`  Pages needing review: ${report.flaggedPages.length}`);
  }
  if (report.failedPages.length > 0) {
    console.log(`  Pages failed: ${report.failedPages.length}`);
  }
  if (!dryRun) {
    console.log(`  Output: ${path.resolve(output)}`);
    console.log(`  Report: ${path.join(path.resolve(output), '_migration_report.md')}`);
  }
}
