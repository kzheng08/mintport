import axios from 'axios';
import * as cheerio from 'cheerio';
import { Branding } from '../types';

export async function detectBrandingFromUrl(url: string): Promise<Partial<Branding>> {
  const branding: Partial<Branding> = {};

  try {
    const { data: html } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(html as string);

    // Try to get site name
    const title = $('title').first().text().trim();
    if (title) branding.name = title.split('|')[0].trim();

    // Try og:site_name
    const siteName = $('meta[property="og:site_name"]').attr('content');
    if (siteName) branding.name = siteName;

    // Try to find primary color in style tags or CSS vars
    const styleContent = $('style').text();
    const colorMatch = styleContent.match(/--primary[^:]*:\s*(#[0-9a-fA-F]{3,6})/);
    if (colorMatch) branding.primaryColor = colorMatch[1];

    // Try to find logo
    const logoEl = $('img[alt*="logo"], img[class*="logo"], [class*="logo"] img').first();
    const logoSrc = logoEl.attr('src');
    if (logoSrc) {
      const absolute = logoSrc.startsWith('http') ? logoSrc : new URL(logoSrc, url).toString();
      branding.logoLight = absolute;
      branding.logoDark = absolute;
    }

    // Favicon
    const favicon =
      $('link[rel="icon"]').attr('href') ??
      $('link[rel="shortcut icon"]').attr('href');
    if (favicon) {
      branding.favicon = favicon.startsWith('http') ? favicon : new URL(favicon, url).toString();
    }
  } catch {
    // Detection is best-effort
  }

  return branding;
}
