export interface SummaryPage {
  title: string;
  path: string;
  children: SummaryPage[];
}

export interface SummaryGroup {
  group: string;
  pages: SummaryPage[];
}

export interface ParsedPage {
  title: string;
  description: string;
  content: string;
  sourcePath: string;
  outputPath: string;
  images: string[];
  flags: MigrationFlag[];
}

export interface MigrationFlag {
  type: 'embed' | 'synced-block' | 'api-block' | 'broken-link';
  message: string;
  line?: number;
}

export interface Branding {
  name: string;
  primaryColor: string;
  logoLight: string;
  logoDark: string;
  favicon: string;
}

export interface MintConfig {
  name: string;
  logo: { light: string; dark: string };
  favicon: string;
  colors: { primary: string };
  navigation: NavGroup[];
}

export interface NavGroup {
  group: string;
  pages: (string | NavGroup)[];
}

export interface MigrationReport {
  totalPages: number;
  convertedPages: number;
  flaggedPages: { path: string; flags: MigrationFlag[] }[];
  brokenLinks: string[];
  brandingAutoDetected: string[];
  brandingNeedsManualInput: string[];
  failedPages: string[];
}

export interface ConvertOptions {
  input: string;
  output: string;
  dryRun: boolean;
  verbose: boolean;
}
