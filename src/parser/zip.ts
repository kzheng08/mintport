import * as fs from 'fs-extra';
import * as path from 'path';
import * as unzipper from 'unzipper';

export async function extractZip(zipPath: string, destDir: string): Promise<string> {
  await fs.ensureDir(destDir);

  await fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: destDir }))
    .promise();

  // Find the root of the extracted content (may be nested in a subfolder)
  const items = await fs.readdir(destDir);
  if (items.length === 1) {
    const single = path.join(destDir, items[0]);
    const stat = await fs.stat(single);
    if (stat.isDirectory()) return single;
  }

  return destDir;
}
