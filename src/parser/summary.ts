import * as fs from 'fs-extra';
import * as path from 'path';
import { SummaryGroup, SummaryPage } from '../types';

interface RawEntry {
  title: string;
  filePath: string;
  depth: number;
}

function parseEntries(content: string): RawEntry[] {
  const entries: RawEntry[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\s*)[*-]\s+\[(.+?)\]\((.+?)\)/);
    if (!match) continue;
    const indent = match[1].length;
    const title = match[2];
    const filePath = match[3];
    // skip anchors and external links
    if (filePath.startsWith('http') || filePath.startsWith('#')) continue;
    entries.push({ title, filePath, depth: Math.floor(indent / 2) });
  }

  return entries;
}

function buildTree(entries: RawEntry[]): SummaryPage[] {
  const root: SummaryPage[] = [];
  const stack: { node: SummaryPage; depth: number }[] = [];

  for (const entry of entries) {
    const node: SummaryPage = {
      title: entry.title,
      path: entry.filePath,
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].depth >= entry.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ node, depth: entry.depth });
  }

  return root;
}

export function parseSummary(summaryPath: string): SummaryGroup[] {
  const content = fs.readFileSync(summaryPath, 'utf-8');
  const lines = content.split('\n');
  const groups: SummaryGroup[] = [];

  let currentGroup: SummaryGroup | null = null;
  let groupLines: string[] = [];

  const flushGroup = () => {
    if (currentGroup && groupLines.length > 0) {
      const entries = parseEntries(groupLines.join('\n'));
      currentGroup.pages = buildTree(entries);
      groups.push(currentGroup);
    }
  };

  for (const line of lines) {
    // Heading lines become group names (skip top-level "# Summary" title)
    const headingMatch = line.match(/^#{1,2}\s+(.+)/);
    if (headingMatch) {
      const groupName = headingMatch[1].trim();
      if (groupName.toLowerCase() === 'summary') continue; // skip the title heading
      flushGroup();
      currentGroup = { group: groupName, pages: [] };
      groupLines = [];
      continue;
    }
    if (currentGroup) {
      groupLines.push(line);
    }
  }

  flushGroup();

  // If no headings found, treat everything as one group
  if (groups.length === 0) {
    const entries = parseEntries(content);
    groups.push({ group: 'Documentation', pages: buildTree(entries) });
  }

  return groups;
}

export function getAllPages(groups: SummaryGroup[]): SummaryPage[] {
  const pages: SummaryPage[] = [];

  function walk(nodes: SummaryPage[]) {
    for (const node of nodes) {
      pages.push(node);
      if (node.children.length > 0) walk(node.children);
    }
  }

  for (const group of groups) {
    walk(group.pages);
  }

  return pages;
}
