import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

interface ScrapedPage {
  title: string;
  path: string;
  content: string;
}

export async function scrapeGitBook(url: string): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mintport-scrape-'));
  console.log(`Scraping GitBook at: ${url}`);
  console.log(`Temp directory: ${tmpDir}`);

  const baseUrl = new URL(url);
  const visited = new Set<string>();
  const pages: ScrapedPage[] = [];

  // Fetch the root page to get navigation links
  const rootHtml = await fetchPage(url);
  const $ = cheerio.load(rootHtml);

  // Collect all internal links from sidebar nav
  const navLinks: string[] = [];
  $('nav a, [data-testid="sidebar"] a, aside a, [class*="sidebar"] a, [class*="nav"] a').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    try {
      const absolute = new URL(href, url).toString();
      if (absolute.startsWith(baseUrl.origin) && !visited.has(absolute)) {
        navLinks.push(absolute);
      }
    } catch {
      // skip invalid URLs
    }
  });

  // Scrape each page
  const allUrls = [url, ...navLinks];
  for (const pageUrl of allUrls) {
    if (visited.has(pageUrl)) continue;
    visited.add(pageUrl);

    try {
      const html = await fetchPage(pageUrl);
      const $page = cheerio.load(html);

      const title = $page('h1').first().text().trim() || $page('title').text().split('|')[0].trim();
      const mainContent = $page('main, article, [class*="content"], [class*="page"]').first().html() ?? '';

      // Convert relative URL to file path
      const urlPath = new URL(pageUrl).pathname;
      const filePath = urlPath === '/' ? 'README.md' : `${urlPath.replace(/^\//, '').replace(/\/$/, '')}.md`;

      pages.push({ title, path: filePath, content: `# ${title}\n\n${mainContent}` });
      console.log(`  Scraped: ${pageUrl}`);
    } catch (err) {
      console.warn(`  Failed to scrape: ${pageUrl}`);
    }
  }

  // Write SUMMARY.md
  const summaryLines = ['# Summary', ''];
  for (const page of pages) {
    summaryLines.push(`* [${page.title}](${page.path})`);
  }
  await fs.writeFile(path.join(tmpDir, 'SUMMARY.md'), summaryLines.join('\n'), 'utf-8');

  // Write page files
  for (const page of pages) {
    const pagePath = path.join(tmpDir, page.path);
    await fs.ensureDir(path.dirname(pagePath));
    await fs.writeFile(pagePath, page.content, 'utf-8');
  }

  return tmpDir;
}

async function fetchPage(url: string): Promise<string> {
  const { data } = await axios.get<string>(url, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; mintport/1.0)' },
  });
  return data;
}
