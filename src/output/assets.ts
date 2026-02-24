import * as fs from 'fs-extra';
import * as path from 'path';

export async function copyAssets(
  images: string[],
  sourceDir: string,
  outputDir: string,
  dryRun: boolean,
  verbose: boolean
): Promise<void> {
  const imagesDir = path.join(outputDir, 'images');

  for (const imgPath of images) {
    const cleanPath = imgPath.split('?')[0]; // strip query strings
    const srcPath = path.resolve(sourceDir, cleanPath);

    if (!await fs.pathExists(srcPath)) {
      if (verbose) console.log(`  [warn] Image not found: ${srcPath}`);
      continue;
    }

    const destPath = path.join(imagesDir, path.basename(cleanPath));

    if (dryRun) {
      if (verbose) console.log(`[dry-run] Would copy asset: ${srcPath} → ${destPath}`);
      continue;
    }

    await fs.ensureDir(imagesDir);
    await fs.copy(srcPath, destPath, { overwrite: true });
    if (verbose) console.log(`  Copied asset: ${path.basename(cleanPath)}`);
  }
}
