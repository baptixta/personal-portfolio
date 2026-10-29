/* Gera o site final em dist/: uma página HTML estática por rota e idioma (para SEO), sitemap.xml e robots.txt.
   Uso:  node build.mjs   (precisa de Node 18+, sem dependências) */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRenderer } from './render.mjs';

const OUT = 'dist';

/* guia do game designer: o conteúdo mora no repo baptixta/guia-do-game-designer.
   No GitHub Actions ele é baixado em guia/ pelo workflow; localmente, se a pasta não existir, é clonada aqui. */
const GUIA = 'guia';
const GUIA_REPO = 'https://github.com/baptixta/guia-do-game-designer.git';
if (!fs.existsSync(GUIA)) {
  try { execSync(`git clone --depth 1 ${GUIA_REPO} ${GUIA}`, { stdio: 'inherit' }); }
  catch (e) { console.error(`\n❌ não consegui baixar o guia (${GUIA_REPO}). Clone o repo na pasta ${GUIA}/ e rode de novo.\n`); process.exit(1); }
}
const read = p => {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { console.error(`\n❌ JSON inválido em ${p}: ${e.message}\n`); process.exit(1); }
};

const D = read('content/site.json');
if (!D.site.url) { console.error('❌ falta "site.url" em content/site.json (ex.: "https://baptixta.com")'); process.exit(1); }
const pages = Object.fromEntries(Object.entries(D.pages).map(([k, p]) => [k, read(p)]));
// fichas do almanaque ficam num JSON à parte (o app.js faz o mesmo no navegador)
for (const p of Object.values(pages))
  if (p.almanaque && p.almanaque.file) p.almanaque.refs = read(p.almanaque.file).refs;
const keys = ['', ...Object.keys(pages)];
const base = D.site.url.replace(/\/$/, '');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const f of ['assets', 'content', 'styles.css', 'app.js', 'render.mjs', 'CNAME'])
  if (fs.existsSync(f)) fs.cpSync(f, path.join(OUT, f), { recursive: true });
// do guia, só os dados e as imagens (o resto do repo não vai para o site)
for (const f of ['guia.json', 'almanaque.json', 'images/cover.png'])
  if (fs.existsSync(path.join(GUIA, f))) fs.cpSync(path.join(GUIA, f), path.join(OUT, GUIA, f), { recursive: true });
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

const verify = (D.site.seo && D.site.seo.googleVerification)
  ? `<meta name="google-site-verification" content="${D.site.seo.googleVerification}">` : '';

const doc = (R, key, p) => `<!doctype html>
<html lang="${R.htmlLang(R.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="index,follow,max-image-preview:large">
${verify}
${R.headHTML(key, p)}
<link rel="icon" href="/assets/logo.svg" type="image/svg+xml">
<script>
/* tema inicial: escolha salva ou padrão do sistema (evita "flash") */
try { document.documentElement.dataset.theme = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light') } catch (e) { }
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,700;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<link rel="modulepreload" href="/render.mjs">
</head>
<body>
<img class="bg-logo" src="/assets/logo.svg" alt="" aria-hidden="true">
<div class="ctrl" id="ctrl">${R.ctrl(key)}</div>
<div class="layout">
<aside class="side" id="side">${R.shell(key)}</aside>
<main id="main">${R.view(key, p)}</main>
</div>
<script type="module" src="/app.js"></script>
</body>
</html>
`;

// páginas: / , /<pagina>/ , /en/ , /en/<pagina>/
for (const lang of ['pt', 'en']) {
  const R = createRenderer(D, lang);
  for (const key of keys) {
    const dir = path.join(OUT, lang === 'en' ? 'en' : '', key);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), doc(R, key, pages[key]));
  }
}

// sitemap com alternativas de idioma (hreflang)
const loc = (key, lang) => base + (lang === 'en' ? '/en/' : '/') + (key ? key + '/' : '');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${['pt', 'en'].flatMap(lang => keys.map(key => `  <url>
    <loc>${loc(key, lang)}</loc>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${loc(key, 'pt')}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${loc(key, 'en')}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc(key, 'pt')}"/>
  </url>`)).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);

// 404 simples (fora do índice)
fs.writeFileSync(path.join(OUT, '404.html'), `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>404</title><link rel="stylesheet" href="/styles.css"></head>
<body><main style="padding:12vh 24px;text-align:center"><h1 class="back" style="border:0"><a href="/">404 · página não encontrada / page not found</a></h1></main></body></html>
`);

console.log(`✅ ${keys.length * 2} páginas geradas em ${OUT}/ (+ sitemap.xml, robots.txt)`);
