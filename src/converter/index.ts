import * as path from 'path';
import matter from 'gray-matter';
import { MigrationFlag, ParsedPage } from '../types';
import { convertHints } from './hints';
import { convertTabs } from './tabs';
import { convertStepper } from './stepper';
import { convertAccordion } from './accordion';
import { convertEmbeds } from './embeds';
import { convertCodeBlocks } from './codeblocks';
import { convertContentRefs } from './contentrefs';
import { convertSyncedBlocks } from './syncedblocks';
import { convertApiBlocks } from './apiblocks';
import { rewriteLinks } from './links';
import { sanitizeMdx } from './sanitize';

const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

function extractImages(content: string): string[] {
  const images: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(IMAGE_REGEX.source, 'g');
  while ((match = re.exec(content)) !== null) {
    const src = match[2];
    if (!src.startsWith('http')) images.push(src);
  }
  return images;
}

function extractDescription(content: string): string {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (!line.startsWith('#') && !line.startsWith('<') && !line.startsWith('{%')) {
      return line.replace(/[*_`]/g, '').slice(0, 160);
    }
  }
  return '';
}

export function convertPage(
  rawContent: string,
  sourcePath: string,
  outputPath: string,
  allPaths: string[],
  sourceDir: string
): ParsedPage {
  // Resolve images relative to the page's own directory
  const pageDir = path.dirname(sourcePath);
  const { data, content: body } = matter(rawContent);
  const flags: MigrationFlag[] = [];

  let content = body;
  content = convertApiBlocks(content, flags);
  content = convertSyncedBlocks(content, flags);
  content = convertHints(content);
  content = convertTabs(content);
  content = convertStepper(content);
  content = convertAccordion(content);
  content = convertEmbeds(content, flags);
  content = convertCodeBlocks(content);
  content = convertContentRefs(content, sourcePath, allPaths, flags);
  content = rewriteLinks(content, sourcePath);
  content = sanitizeMdx(content);

  const title: string = data.title ?? extractTitleFromContent(body) ?? 'Untitled';
  const description: string = data.description ?? extractDescription(content);
  // Resolve image paths relative to the page's directory
  const images = extractImages(content).map(img => {
    if (img.startsWith('/') || img.startsWith('http')) return img;
    return path.normalize(path.join(pageDir, img));
  });

  return { title, description, content, sourcePath, outputPath, images, flags };
}

function extractTitleFromContent(content: string): string | null {
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : null;
}
