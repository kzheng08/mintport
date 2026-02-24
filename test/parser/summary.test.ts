import * as path from 'path';
import { parseSummary, getAllPages } from '../../src/parser/summary';

const FIXTURE = path.join(__dirname, '../fixtures/mock-gitbook/SUMMARY.md');

describe('parseSummary', () => {
  it('parses two groups from the mock SUMMARY.md', () => {
    const groups = parseSummary(FIXTURE);
    expect(groups).toHaveLength(2);
    expect(groups[0].group).toBe('Getting Started');
    expect(groups[1].group).toBe('Advanced');
  });

  it('each group has the right number of pages', () => {
    const groups = parseSummary(FIXTURE);
    expect(groups[0].pages).toHaveLength(2);
    expect(groups[1].pages).toHaveLength(2);
  });

  it('page titles and paths are parsed correctly', () => {
    const groups = parseSummary(FIXTURE);
    expect(groups[0].pages[0].title).toBe('Introduction');
    expect(groups[0].pages[0].path).toBe('getting-started/introduction.md');
  });
});

describe('getAllPages', () => {
  it('returns all 4 pages flat', () => {
    const groups = parseSummary(FIXTURE);
    const pages = getAllPages(groups);
    expect(pages).toHaveLength(4);
  });
});
