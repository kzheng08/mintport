import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import TurndownService from 'turndown';

interface ScrapedPage {
  title: string;
  path: string;
  content: string;
}

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

export async function scrapeGitBook(url: string): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mintport-scrape-'));
  console.log(`Scraping GitBook at: ${url}`);
  console.log('Note: URL scraping works best with simple GitBook sites. For full fidelity, use a downloaded GitBook export instead.');

  const baseUrl = new URL(url);
  const visited = new Set<string>();
  const pages: ScrapedPage[] = [];

  // Fetch the root page to get navigation links
  const rootHtml = await fetchPage(url);
  const $ = cheerio.load(rootHtml);

  // Collect all internal links from sidebar nav — skip pure anchor links
  const navLinks: string[] = [];
  $('nav a, [data-testid="sidebar"] a, aside a, [class*="sidebar"] a, [class*="nav"] a').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('#')) return; // skip anchor-only links
    try {
      const parsed = new URL(href, url);
      parsed.hash = ''; // strip fragment
      const absolute = parsed.toString();
      if (absolute.startsWith(baseUrl.origin) && !visited.has(absolute) && absolute !== url) {
        navLinks.push(absolute);
      }
    } catch {
      // skip invalid URLs
    }
  });

  // Scrape each page
  const allUrls = [url, ...navLinks];
  for (const pageUrl of allUrls) {
    // Normalize URL — strip fragment before deduplication
    const normalizedUrl = (() => { const u = new URL(pageUrl); u.hash = ''; return u.toString(); })();
    if (visited.has(normalizedUrl)) continue;
    visited.add(normalizedUrl);

    try {
      const html = await fetchPage(normalizedUrl);
      const $page = cheerio.load(html);

      const title = $page('h1').first().text().trim() || $page('title').text().split('|')[0].trim();
      // Try multiple content selectors — GitBook uses different class names
      const contentEl = $page('[class*="page-body"], [class*="markdown"], main article, main').first();
      // Remove nav, header, footer noise
      contentEl.find('nav, header, footer, script, style, [class*="sidebar"], [class*="navbar"]').remove();
      const rawHtml = contentEl.html() ?? '';
      const markdown = turndown.turndown(rawHtml);

      // Convert relative URL to file path
      const urlPath = new URL(normalizedUrl).pathname;
      const filePath = urlPath === '/' ? 'README.md' : `${urlPath.replace(/^\//, '').replace(/\/$/, '')}.md`;

      pages.push({ title, path: filePath, content: `# ${title}\n\n${markdown}` });
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
