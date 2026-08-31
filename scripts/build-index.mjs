#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'ui', 'data');

async function markdownFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md') files.push(fullPath);
  }
  return files;
}

function frontmatterAndBody(source) {
  if (!source.startsWith('---')) return { frontmatter: '', body: source };
  const end = source.indexOf('\n---', 3);
  if (end < 0) return { frontmatter: '', body: source };
  return {
    frontmatter: source.slice(3, end).trim(),
    body: source.slice(end + 4).replace(/^\n+/, '').trim(),
  };
}

function scalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!match) return '';
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function parseTags(frontmatter) {
  const match = frontmatter.match(/^tags:\s*\[([^\]]*)\]/m);
  if (!match) return [];
  return match[1].split(',').map((tag) => tag.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

function generatedAt(frontmatter) {
  const strip = (value) => value.trim().replace(/^['"]|['"]$/g, '');
  const inline = frontmatter.match(/generated:\s*\{[^}]*at:\s*([^,}]+)/m);
  if (inline) return strip(inline[1]);
  const block = frontmatter.match(/^generated:\s*\n(?:[ \t]+.+\n)*?[ \t]+at:\s*(\S+)/m);
  return block ? strip(block[1]) : '';
}

function sources(frontmatter) {
  return [...frontmatter.matchAll(/resource:\s*(https?:\/\/[^\s]+)/g)].map((match) => match[1]);
}

function titleFromBody(body, fallback) {
  const heading = body.match(/^#\s+(.+)$/m);
  return heading ? heading[1].trim() : fallback;
}

function parseTopics(indexSource) {
  const topics = [];
  let current = null;
  for (const line of indexSource.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      current = { name: heading[1].trim(), slugs: [] };
      topics.push(current);
      continue;
    }
    const link = line.match(/^\*\s+\[[^\]]+\]\(([^)]+)\)/);
    if (current && link) current.slugs.push(path.basename(link[1], '.md'));
  }
  return topics;
}

function toSlug(filePath) {
  return path.basename(filePath, '.md');
}

async function build() {
  const conceptIndex = await fs.readFile(path.join(root, 'concepts', 'index.md'), 'utf8');
  const topicGroups = parseTopics(conceptIndex);
  const topicBySlug = new Map();
  for (const topic of topicGroups) {
    for (const slug of topic.slugs) {
      if (!topicBySlug.has(slug)) topicBySlug.set(slug, topic.name);
    }
  }
  const files = [
    ...(await markdownFiles(path.join(root, 'concepts'))).map((file) => ({ file, section: 'concepts' })),
    ...(await markdownFiles(path.join(root, 'references'))).map((file) => ({ file, section: 'references' })),
  ];

  const articles = [];
  for (const { file, section } of files) {
    const source = await fs.readFile(file, 'utf8');
    const { frontmatter, body } = frontmatterAndBody(source);
    const slug = toSlug(file);
    const title = scalar(frontmatter, 'title') || titleFromBody(body, slug);
    articles.push({
      slug,
      type: scalar(frontmatter, 'type') || 'Article',
      title,
      description: scalar(frontmatter, 'description'),
      tags: parseTags(frontmatter),
      status: scalar(frontmatter, 'status') || 'stable',
      generatedAt: generatedAt(frontmatter),
      topic: topicBySlug.get(slug) || (section === 'references' ? 'References' : '未分类'),
      sources: sources(frontmatter),
      contentUrl: `../${section}/${path.relative(path.join(root, section), file).replaceAll(path.sep, '/')}`,
    });
  }

  articles.sort((a, b) => (b.generatedAt || '').localeCompare(a.generatedAt || '') || a.title.localeCompare(b.title, 'zh-CN'));
  const payload = {
    topicNames: topicGroups.map((topic) => topic.name),
    articles,
    logUrl: '../log.md',
  };

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'index.json'), `${JSON.stringify(payload)}\n`);
  console.log(`Built catalog for ${articles.length} entries and ${topicGroups.length} topics.`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
