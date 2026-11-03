/* Traz as edições da newsletter "bom dia, gedê" do Substack para content/newsletter/.
   Uso:  node sync-newsletter.mjs            (só baixa edições novas ou editadas)
         node sync-newsletter.mjs --all      (baixa tudo de novo)
         node sync-newsletter.mjs --raw dir  (lê os posts de dir/<slug>.json antes de ir na API)
   Usa a API pública do Substack (não documentada). Se ela falhar, avisa e sai sem erro:
   o site continua com as edições que já estão no repositório. */
import fs from 'node:fs';
import path from 'node:path';

const PUB = 'https://baptixta.substack.com';
const API = PUB + '/api/v1';
const OUT = 'content/newsletter';
const POSTS = path.join(OUT, 'posts');
const DESDE = '2024-04-01'; // a newsletter começa no "bom dia, gedê #00"; posts mais antigos ficam de fora
const args = process.argv.slice(2);
const ALL = args.includes('--all');
const RAW = args.includes('--raw') ? args[args.indexOf('--raw') + 1] : '';

const sleep = ms => new Promise(r => setTimeout(r, ms));
// o Substack responde 429 se pedirmos rápido demais: espera e tenta de novo
async function get(url) {
  for (let t = 0; t < 6; t++) {
    const r = await fetch(url, { headers: { accept: 'application/json' } });
    if (r.ok) return r.json();
    if (r.status !== 429 && r.status < 500) throw new Error(`${r.status} em ${url}`);
    await sleep(3000 * (t + 1));
  }
  throw new Error(`sem resposta de ${url}`);
}

/* ---------- limpeza do HTML do Substack ---------- */
const ent = s => String(s ?? '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const attrsOf = s => {
  const a = {};
  for (const m of (s || '').matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) a[m[1].toLowerCase()] = ent(m[2] ?? m[3] ?? m[4] ?? '');
  return a;
};
const json = s => { try { return JSON.parse(s); } catch (e) { return {}; } };
const ext = u => /^https?:/.test(u) && !u.startsWith(PUB) ? ' target="_blank" rel="noopener"' : '';

const VOID = new Set(['img', 'br', 'hr', 'source', 'input', 'wbr', 'meta', 'link']);
const KEEP = new Set(['p', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'ul', 'ol', 'li', 'blockquote', 'figure', 'figcaption', 'code', 'pre', 'sup', 'sub']);
const DROP = new Set(['script', 'style', 'svg', 'button', 'form', 'input', 'select', 'textarea', 'source', 'iframe']);

// troca os blocos especiais do Substack por HTML do site; null = remove o bloco inteiro
function special(tag, a, post) {
  const c = a.class || '';
  const d = json(a['data-attrs']);
  const watch = (what) => `<p class="nl-media"><a href="${esc(post.canonical_url)}" target="_blank" rel="noopener">${what}</a></p>`;
  if (/\byoutube-wrap\b/.test(c) && d.videoId) return `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(d.videoId)}" title="YouTube" loading="lazy" allowfullscreen></iframe></div>`;
  if (/\bspotify-wrap\b/.test(c)) {
    const src = a.src || '';
    return /^https:\/\/open\.spotify\.com\/embed\//.test(src) ? `<div class="nl-spotify"><iframe src="${esc(src)}" title="${esc(d.title || 'Spotify')}" loading="lazy" allow="encrypted-media"></iframe></div>` : null;
  }
  if (/\binstagram-embed-wrap\b/.test(c) && d.instagram_id) {
    const url = `https://www.instagram.com/p/${encodeURIComponent(d.instagram_id)}/`;
    const thumb = d.thumbnail_url ? `<img src="${esc(d.thumbnail_url)}" alt="" loading="lazy">` : '';
    return `<a class="nl-card" href="${url}" target="_blank" rel="noopener">${thumb}<span><b>${esc(d.author_name || 'Instagram')}</b><small>${esc((d.title || '').replace(/^.*?on Instagram:\s*/, '').replace(/^"|"$/g, ''))}</small></span></a>`;
  }
  if (/\btwitter-embed\b/.test(c) && d.url) {
    const text = String(d.full_text || '').replace(/<[^>]+>/g, '');
    return `<blockquote class="nl-tweet"><p>${esc(text).replace(/\n/g, '<br>')}</p><a href="${esc(d.url)}" target="_blank" rel="noopener">— ${esc(d.name || d.username || 'X')}</a></blockquote>`;
  }
  if (/\b(digest-post-embed|embedded-post-wrap)\b/.test(c)) {
    const url = d.url || (d.slug ? `${PUB}/p/${d.slug}` : '') || (d.canonical_url || '');
    if (!url || !d.title) return null;
    return `<a class="nl-card" href="${esc(url)}"${ext(url)}><span><b>${esc(d.title)}</b>${d.caption || d.truncated_body_text ? `<small>${esc(d.caption || d.truncated_body_text)}</small>` : ''}</span></a>`;
  }
  if (/\bnative-video-embed\b/.test(c)) return watch('▶ assistir o vídeo na edição original');
  if (/\bnative-audio-embed\b/.test(c)) return watch('▶ ouvir o áudio na edição original');
  if (/\bbutton-wrapper\b/.test(c) && d.url) return `<p class="links"><a href="${esc(d.url)}"${ext(d.url)}>${esc(d.text || d.url)}</a></p>`;
  if (/\b(subscription-widget|poll-embed|embedded-publication)/.test(c)) return null;
  return undefined; // não é especial
}

function clean(html, post) {
  const out = [];
  const stack = []; // { tag, mode: 'keep' | 'unwrap' | 'skip' }
  let skip = 0; // > 0: dentro de um bloco removido
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|[^<]+|</g;
  for (const m of html.matchAll(re)) {
    const [raw, close, name, attr, selfClose] = m;
    if (!name) { if (!skip && !raw.startsWith('<!--')) out.push(raw === '<' ? '&lt;' : raw); continue; }
    const tag = name.toLowerCase();
    if (close) {
      // fecha até o último elemento com o mesmo nome
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag !== tag) continue;
        const [el] = stack.splice(i, 1);
        stack.length = i;
        if (el.mode === 'skip') skip--;
        else if (!skip && el.mode === 'keep') out.push(`</${el.out}>`);
        break;
      }
      continue;
    }
    const isVoid = VOID.has(tag) || selfClose;
    if (skip) { if (!isVoid) { stack.push({ tag, mode: 'skip' }); skip++; } continue; }
    const a = attrsOf(attr);
    const sp = special(tag, a, post);
    if (sp !== undefined) {
      if (sp) out.push(sp);
      if (!isVoid) { stack.push({ tag, mode: 'skip' }); skip++; }
      continue;
    }
    if (DROP.has(tag)) { if (!isVoid) { stack.push({ tag, mode: 'skip' }); skip++; } continue; }
    if (tag === 'img') {
      if (a.src) out.push(`<img src="${esc(a.src)}" alt="${esc(a.alt || '')}" loading="lazy"${a.width && a.height ? ` width="${esc(a.width)}" height="${esc(a.height)}"` : ''}>`);
      continue;
    }
    if (tag === 'br' || tag === 'hr') { out.push(`<${tag}>`); continue; }
    if (isVoid) continue;
    if (tag === 'a') {
      // links que só abrem a imagem ampliada viram só a imagem
      if (/\bimage-link\b/.test(a.class || '') || !a.href || /^javascript:/i.test(a.href)) { stack.push({ tag, mode: 'unwrap' }); continue; }
      out.push(`<a href="${esc(a.href)}"${ext(a.href)}>`);
      stack.push({ tag, mode: 'keep', out: 'a' });
      continue;
    }
    if (tag === 'div' && /\bcallout-block\b/.test(a.class || '')) { out.push('<div class="nl-callout">'); stack.push({ tag, mode: 'keep', out: 'div' }); continue; }
    if (tag === 'div' && /\bpullquote\b/.test(a.class || '')) { out.push('<blockquote class="nl-pull">'); stack.push({ tag, mode: 'keep', out: 'blockquote' }); continue; }
    const t = tag === 'h1' ? 'h2' : tag;
    if (KEEP.has(t)) { out.push(`<${t}>`); stack.push({ tag, mode: 'keep', out: t }); continue; }
    stack.push({ tag, mode: 'unwrap' }); // div, span, picture...: some a tag, fica o conteúdo
  }
  return out.join('')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/^(\s*<hr>)+/, '') // a edição costuma abrir com uma linha
    .trim();
}

/* ---------- sincronização ---------- */
async function main() {
  fs.mkdirSync(POSTS, { recursive: true });
  const list = [];
  for (let off = 0; ; off += 12) {
    const page = await get(`${API}/archive?sort=new&limit=12&offset=${off}`);
    if (!page.length) break;
    list.push(...page);
    await sleep(400);
  }
  const posts = list.filter(p => p.audience === 'everyone' && p.type === 'newsletter' && p.post_date >= DESDE)
    .sort((a, b) => b.post_date.localeCompare(a.post_date));

  let n = 0;
  for (const p of posts) {
    const file = path.join(POSTS, p.slug + '.json');
    const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
    if (old && !ALL && old.updated === (p.updated_at || p.post_date)) continue;
    const rawFile = RAW && path.join(RAW, p.slug + '.json');
    const full = rawFile && fs.existsSync(rawFile) ? JSON.parse(fs.readFileSync(rawFile, 'utf8')) : (await sleep(900), await get(`${API}/posts/${p.slug}`));
    fs.writeFileSync(file, JSON.stringify({
      slug: p.slug,
      title: full.title,
      subtitle: full.subtitle || '',
      date: full.post_date,
      updated: p.updated_at || p.post_date,
      cover: full.cover_image || '',
      url: full.canonical_url,
      words: full.wordcount || 0,
      html: clean(full.body_html || '', full)
    }, null, 2) + '\n');
    n++;
  }

  // edições que saíram do Substack (apagadas ou fechadas) saem do site também
  const slugs = new Set(posts.map(p => p.slug));
  for (const f of fs.readdirSync(POSTS)) if (!slugs.has(f.replace(/\.json$/, ''))) fs.rmSync(path.join(POSTS, f));

  const idxFile = path.join(OUT, 'index.json');
  const idx = fs.existsSync(idxFile) ? JSON.parse(fs.readFileSync(idxFile, 'utf8')) : {};
  idx.posts = posts.map(p => {
    const e = JSON.parse(fs.readFileSync(path.join(POSTS, p.slug + '.json'), 'utf8'));
    return { slug: e.slug, title: e.title, subtitle: e.subtitle, date: e.date, cover: e.cover, words: e.words };
  });
  fs.writeFileSync(idxFile, JSON.stringify(idx, null, 2) + '\n');
  console.log(`✅ newsletter: ${posts.length} edições (${n} atualizadas)`);
}

main().catch(e => { console.warn(`⚠️ newsletter não sincronizada (${e.message}); o site segue com as edições do repositório`); });
