const app = document.querySelector('#app');
const state = { data: null, query: '', topic: '', tag: '', content: new Map(), articleRequest: 0 };

const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const slug = (value) => encodeURIComponent(value);
const formatDate = (value) => value ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : '未记录时间';
const getArticle = (value) => state.data.articles.find((article) => article.slug === decodeURIComponent(value));

function enrichCatalog(data) {
  const topicCounts = new Map();
  const tagCounts = new Map();
  for (const article of data.articles) {
    topicCounts.set(article.topic, (topicCounts.get(article.topic) || 0) + 1);
    for (const tag of article.tags) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }
  data.topics = data.topicNames.map((name) => ({ name, count: topicCounts.get(name) || 0 }));
  data.tags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));
  data.counts = { articles: data.articles.length, topics: data.topics.length, tags: data.tags.length };
  return data;
}

function stripFrontmatter(source) {
  if (!source.startsWith('---')) return source.trim();
  const end = source.indexOf('\n---', 3);
  return end < 0 ? source.trim() : source.slice(end + 4).replace(/^\n+/, '').trim();
}

function inlineMarkdown(value) {
  let output = esc(value);
  output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
  output = output.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const articleMatch = href.match(/(?:^|\/)\s*([^/]+)\.md(?:#.*)?$/);
    const target = articleMatch ? `#/article/${encodeURIComponent(articleMatch[1])}` : href;
    return `<a href="${target}">${label}</a>`;
  });
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return output;
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const output = [];
  let list = null;
  let paragraph = [];
  let code = false;
  const flushParagraph = () => { if (paragraph.length) { output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`); paragraph = []; } };
  const flushList = () => { if (list) { output.push(`<${list.type}>${list.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</${list.type}>`); list = null; } };
  for (const line of lines) {
    if (line.startsWith('```')) { flushParagraph(); flushList(); if (!code) { output.push('<pre><code>'); code = true; } else { output.push('</code></pre>'); code = false; } continue; }
    if (code) { output.push(`${esc(line)}\n`); continue; }
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { flushParagraph(); flushList(); const level = heading[1].length; output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); continue; }
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) { flushParagraph(); flushList(); output.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`); continue; }
    const item = line.match(/^\s*[-*]\s+(.+)$/) || line.match(/^\s*\d+\.\s+(.+)$/);
    if (item) { flushParagraph(); const type = line.match(/^\s*\d+\./) ? 'ol' : 'ul'; if (!list || list.type !== type) { flushList(); list = { type, items: [] }; } list.items.push(item[1]); continue; }
    paragraph.push(line.trim());
  }
  flushParagraph(); flushList();
  return output.join('');
}

function articleCard(article) {
  return `<a class="card" href="#/article/${slug(article.slug)}"><div class="meta">${esc(article.topic)} · ${formatDate(article.generatedAt)}</div><h3>${esc(article.title)}</h3><p>${esc(article.description || '暂无摘要')}</p><div>${article.tags.slice(0, 4).map((tag) => `<span class="pill">${esc(tag)}</span>`).join('')}</div></a>`;
}

function renderHome() {
  const recent = state.data.articles.slice(0, 6);
  const topics = state.data.topics.slice(0, 6);
  app.innerHTML = `<section class="hero"><div><div class="eyebrow">Open Knowledge Format</div><h1>把零散文章，变成可探索的知识。</h1><p class="lead">一个基于 Markdown 的只读知识库界面。搜索文章、浏览主题、追踪每一次更新，内容始终由仓库中的知识文件驱动。</p></div><form class="searchbox" id="home-search"><input aria-label="搜索知识" placeholder="搜索标题、摘要或标签" value="${esc(state.query)}"><button>搜索</button></form></section><section class="stats"><div class="stat"><strong>${state.data.counts.articles}</strong><span>知识条目</span></div><div class="stat"><strong>${state.data.counts.topics}</strong><span>主题分类</span></div><div class="stat"><strong>${state.data.counts.tags}</strong><span>标签</span></div></section><section><div class="section-head"><h2>主题浏览</h2><a href="#/library">查看全部 →</a></div><div class="card-grid">${topics.map((topic) => `<a class="card" href="#/library?topic=${encodeURIComponent(topic.name)}"><div class="eyebrow">${topic.count} 篇</div><h3>${esc(topic.name)}</h3><p>浏览这个主题下的知识概念与文章沉淀。</p></a>`).join('')}</div></section><section><div class="section-head"><h2>最近更新</h2><a href="#/library">全部文章 →</a></div><div class="card-grid">${recent.map(articleCard).join('')}</div></section>`;
  document.querySelector('#home-search').addEventListener('submit', (event) => { event.preventDefault(); state.query = event.currentTarget.querySelector('input').value.trim(); location.hash = `#/library${state.query ? `?q=${encodeURIComponent(state.query)}` : ''}`; });
}

function filteredArticles() {
  const query = state.query.toLowerCase();
  return state.data.articles.filter((article) => (!state.topic || article.topic === state.topic) && (!state.tag || article.tags.includes(state.tag)) && (!query || [article.title, article.description, article.tags.join(' ')].join(' ').toLowerCase().includes(query)));
}

function renderLibrary() {
  const articles = filteredArticles();
  app.innerHTML = `<section><div class="library-head"><div><div class="eyebrow">Knowledge library</div><h1>浏览知识</h1></div><span class="count">${articles.length} 个结果</span></div><div class="library-tools"><form class="searchbox" id="library-search"><input aria-label="搜索知识" placeholder="搜索标题、摘要或标签" value="${esc(state.query)}"><button>搜索</button></form><div class="filter-toolbar"><div class="filter-group"><span class="filter-label">主题</span><div class="filter-chips"><button class="filter ${!state.topic ? 'active' : ''}" data-topic="">全部主题</button>${state.data.topics.map((topic) => `<button class="filter ${state.topic === topic.name ? 'active' : ''}" data-topic="${esc(topic.name)}">${esc(topic.name)} <span class="meta">(${topic.count})</span></button>`).join('')}</div></div><div class="filter-group"><span class="filter-label">标签</span><div class="filter-chips">${state.data.tags.slice(0, 18).map((tag) => `<button class="filter ${state.tag === tag.name ? 'active' : ''}" data-tag="${esc(tag.name)}">${esc(tag.name)} <span class="meta">(${tag.count})</span></button>`).join('')}</div></div></div></div><div class="article-list" style="margin-top:17px">${articles.length ? articles.map((article) => `<a class="article-row" href="#/article/${slug(article.slug)}"><div class="meta">${esc(article.topic)} · ${esc(article.type)} · ${formatDate(article.generatedAt)}</div><h3>${esc(article.title)}</h3><p>${esc(article.description || '暂无摘要')}</p><div>${article.tags.map((tag) => `<span class="pill">${esc(tag)}</span>`).join('')}</div></a>`).join('') : '<div class="empty">没有找到匹配的知识条目。</div>'}</div></section>`;
  const librarySearch = document.querySelector('#library-search');
  const submitSearch = () => { state.query = librarySearch.querySelector('input').value.trim(); renderLibrary(); };
  librarySearch.addEventListener('submit', (event) => { event.preventDefault(); submitSearch(); });
  librarySearch.querySelector('input').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); submitSearch(); } });
  document.querySelectorAll('[data-topic]').forEach((button) => button.addEventListener('click', () => { state.topic = button.dataset.topic; renderLibrary(); }));
  document.querySelectorAll('[data-tag]').forEach((button) => button.addEventListener('click', () => { state.tag = button.dataset.tag; renderLibrary(); }));
}

async function renderArticle(article) {
  if (!article) { app.innerHTML = '<div class="empty">文章不存在或已被移除。</div>'; return; }
  const requestId = ++state.articleRequest;
  app.innerHTML = '<div class="loading">正在加载文章…</div>';
  try {
    let content = state.content.get(article.slug);
    if (!content) {
      const response = await fetch(article.contentUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      content = stripFrontmatter(await response.text());
      state.content.set(article.slug, content);
    }
    if (requestId !== state.articleRequest) return;
    app.innerHTML = `<div class="article-layout"><article class="article"><div class="meta"><a href="#/library">知识库</a> / ${esc(article.topic)}</div><h1>${esc(article.title)}</h1><p class="lead">${esc(article.description || '')}</p><div style="margin:18px 0">${article.tags.map((tag) => `<span class="pill">${esc(tag)}</span>`).join('')}</div><div class="article-body">${renderMarkdown(content)}</div></article><aside class="side-panel"><h3>条目信息</h3><dl><dt>类型</dt><dd>${esc(article.type)}</dd><dt>状态</dt><dd>${esc(article.status)}</dd><dt>主题</dt><dd>${esc(article.topic)}</dd><dt>生成时间</dt><dd>${formatDate(article.generatedAt)}</dd><dt>来源</dt><dd>${article.sources.length ? article.sources.map((source) => `<a href="${esc(source)}" target="_blank" rel="noreferrer">打开原文 ↗</a>`).join('<br>') : '暂无来源链接'}</dd></dl></aside></div>`;
  } catch (error) {
    if (requestId === state.articleRequest) app.innerHTML = `<div class="error">文章加载失败：${esc(error.message)}</div>`;
  }
}

async function renderChanges() {
  app.innerHTML = '<div class="loading">正在加载更新记录…</div>';
  try {
    const response = await fetch(state.data.logUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const log = await response.text();
    app.innerHTML = `<section class="article"><div class="eyebrow">Changelog</div><h1>更新记录</h1><div class="article-body">${renderMarkdown(log)}</div></section>`;
  } catch (error) { app.innerHTML = `<div class="error">更新记录加载失败：${esc(error.message)}</div>`; }
}

function route() {
  const [pathPart, queryPart = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const params = new URLSearchParams(queryPart);
  state.query = params.get('q') || (pathPart === 'library' ? state.query : '');
  state.topic = params.get('topic') || '';
  state.tag = params.get('tag') || '';
  if (pathPart.startsWith('article/')) renderArticle(getArticle(pathPart.slice('article/'.length)));
  else if (pathPart === 'library') { state.articleRequest += 1; renderLibrary(); }
  else if (pathPart === 'changes') { state.articleRequest += 1; renderChanges(); }
  else { state.articleRequest += 1; renderHome(); }
}

async function start() {
  try { const response = await fetch('./data/index.json'); if (!response.ok) throw new Error(`HTTP ${response.status}`); state.data = enrichCatalog(await response.json()); route(); window.addEventListener('hashchange', route); }
  catch (error) { app.innerHTML = `<div class="error">知识库索引加载失败：${esc(error.message)}<br><small>请先运行 <code>npm run build</code>。</small></div>`; }
}
start();
