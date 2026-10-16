const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const store = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } }
};

/* ---------- idioma: escolha salva ou idioma do sistema (pt ou en) ---------- */
let lang = store.get('lang') || ((navigator.language || 'en').toLowerCase().startsWith('pt') ? 'pt' : 'en');
// qualquer texto no JSON pode ser "string" ou { "pt": "...", "en": "..." }
const t = v => v && typeof v === 'object' && !Array.isArray(v) && ('pt' in v || 'en' in v) ? (v[lang] ?? v.pt ?? v.en) : v;
const esc = s => String(t(s) ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nl = s => esc(s).replace(/\n/g, '<br>');
const isText = b => typeof b === 'string' || (b && ('pt' in b || 'en' in b));

let D, raf, key = '', started = false, busy = false, queued = false;
const cache = {};
const closed = new Set();
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------- blocos de HTML ---------- */
const social = () => D.site.social.map(s =>
  `<a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.name)}"><i style="--i:url(assets/${esc(s.icon)})"></i></a>`).join('');

const contact = () => `<section class="sec"><h2>${esc(D.contact.title)}</h2><p>${nl(D.contact.text)}</p><div class="social big">${social()}</div></section>`;

const chevron = '<svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function shell() {
  const s = D.site;
  $('#avatar').src = s.avatar;
  $('#name').innerHTML = `${esc(s.name[0])} <b>${esc(s.name[1])}</b>`;
  $('#bio').innerHTML = nl(s.bio);
  $('#social-top').innerHTML = social();
  $('#burger').textContent = '☰ ' + t(D.ui.menu);
  $('#nav').innerHTML = D.nav.map((g, i) => `<div class="grp${closed.has(i) ? ' closed' : ''}" data-i="${i}">
    <button class="t" aria-expanded="${!closed.has(i)}"><span>${esc(g.title)}</span>${chevron}</button>
    <div class="items"><div>${g.items.map(it => it.page
    ? `<a href="#/${esc(it.page)}">${esc(it.label)}</a>`
    : `<a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.label)}</a>`).join('')}</div></div></div>`).join('');
  markActive();
}

function markActive() {
  document.querySelectorAll('#nav .items a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#/' + key));
}

function home() {
  const h = D.home;
  const cards = h.cards.map(c => {
    const link = c.url ? `href="${esc(c.url)}" target="_blank" rel="noopener"` : `href="#/${esc(c.page)}"`;
    return `<a class="card" ${link} aria-label="${esc(c.title)}"><img src="${esc(c.img)}" alt="${esc(c.title)}" draggable="false"></a>`;
  }).join('');
  const secs = h.sections.map(s => `<section class="sec"><h2>${esc(s.title)}</h2>${s.rows.map(r => {
    r = Array.isArray(r) ? { cols: r } : r;
    const inner = r.cols.map(x => `<span>${esc(x)}</span>`).join('');
    return r.url
      ? `<a class="row c${r.cols.length}" href="${esc(r.url)}" target="_blank" rel="noopener">${inner}</a>`
      : `<div class="row c${r.cols.length}">${inner}</div>`;
  }).join('')}</section>`).join('');
  return `<div class="page"><div class="hand">${cards}</div>${secs}${contact()}</div>`;
}

function game(p) {
  const vid = id => id ? `<div class="video"><iframe src="${/^https?:/.test(id) ? esc(id) : 'https://www.youtube-nocookie.com/embed/' + esc(id)}" allowfullscreen loading="lazy" title="vídeo"></iframe></div>` : '';
  const blk = b => isText(b) ? `<p>${nl(b)}</p>`
    : b.list ? `<div class="resp list">${b.list.map(i => `<span>${esc(i)}</span>`).join('')}</div>`
      : b.img ? `<img class="media" src="${esc(b.img)}" alt="${esc(b.alt || '')}">` : vid(b.video);
  const links = (p.links || []).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('');
  const shots = (p.screenshots || []).map(s => `<a href="${esc(s)}" target="_blank"><img src="${esc(s)}" alt="" loading="lazy"></a>`).join('');
  const resp = (p.responsabilidades || []).map(r => `<div class="resp">${esc(r.title)}${r.items.map(i => `<span>${esc(i)}</span>`).join('')}</div>`).join('');
  return `<div class="page"><h2>${esc(p.title)}</h2>${vid(p.trailer)}
    ${links ? `<div class="links">${links}</div>` : ''}
    ${shots ? `<div class="shots">${shots}</div>` : ''}
    ${p.description ? `<p class="desc">${nl(p.description)}</p>` : ''}
    ${resp ? `<section class="sec"><h3>${esc(D.ui.resp)}</h3>${resp}</section>` : ''}
    ${(p.sections || []).map(s => `<section class="sec"><h3>${esc(s.title)}</h3>${s.blocks.map(blk).join('')}</section>`).join('')}
    ${contact()}</div>`;
}

/* ---------- cartas estilo Balatro: flutuação idle + hover com tilt, escala e "juice" ---------- */
function cards() {
  const els = [...document.querySelectorAll('.card')], n = els.length;
  if (!n) return;
  const a = reduce ? 0 : 1;
  const S = els.map((el, i) => ({ el, i, ph: i * 1.9, hv: 0, over: 0, mx: 0, my: 0, rx: 0, ry: 0, t0: -1e9 }));
  S.forEach(c => {
    c.el.onpointerenter = () => { c.over = 1; c.t0 = performance.now(); };
    c.el.onpointerleave = () => { c.over = 0; c.mx = c.my = 0; };
    c.el.onpointermove = ev => {
      const r = c.el.getBoundingClientRect();
      c.mx = (ev.clientX - r.left) / r.width * 2 - 1;
      c.my = (ev.clientY - r.top) / r.height * 2 - 1;
    };
  });
  const loop = now => {
    const tt = now / 1e3;
    S.forEach(c => {
      const m = c.i - (n - 1) / 2;
      c.hv += (c.over - c.hv) * .2;
      c.rx += (-c.my * 14 * c.over - c.rx) * .2;
      c.ry += (c.mx * 14 * c.over - c.ry) * .2;
      const w = (now - c.t0) / 1e3, wob = Math.sin(w * 20) * Math.exp(-w * 5) * 5 * a;
      const rz = (m * 3 + Math.sin(tt * 1.1 + c.ph) * 2 * a) * (1 - c.hv) + wob;
      const y = (m * m * 4 + Math.sin(tt * .9 + c.ph) * 5 * a) * (1 - c.hv) - 16 * c.hv;
      const x = Math.cos(tt * .7 + c.ph) * 2 * a * (1 - c.hv);
      c.el.style.transform = `translate(${x}px,${y}px) rotate(${rz}deg) scale(${1 + .2 * c.hv}) perspective(600px) rotateX(${c.rx}deg) rotateY(${c.ry}deg)`;
      c.el.style.filter = `drop-shadow(${-m * 2 * (1 - c.hv)}px ${6 + 16 * c.hv}px ${8 + 14 * c.hv}px rgba(0,0,0,.22))`;
      c.el.style.zIndex = c.over ? 10 : c.i;
    });
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

/* ---------- páginas ---------- */
const getKey = () => location.hash.replace(/^#\/?/, '');

async function load(k) {
  const path = D.pages[k];
  if (!path) return null;
  if (!cache[k]) {
    try { cache[k] = await (await fetch(path)).json(); } catch (e) { return null; }
  }
  return cache[k];
}

function paint(k) {
  cancelAnimationFrame(raf);
  const p = cache[k];
  key = p ? k : '';
  $('#main').innerHTML = `<div class="view">${p ? game(p) : home()}</div>`;
  document.title = (p ? t(p.title) + ' · ' : '') + D.site.name.join(' ');
  markActive();
  document.body.classList.remove('menu');
  if (!p) cards();
}

/* transição: a página atual sai para a direita e a nova entra vindo da direita */
async function slideOut() {
  const v = $('#main .view');
  if (!v || reduce) return;
  v.style.transition = 'transform .45s cubic-bezier(.7,0,.84,0), opacity .45s ease-in';
  v.style.transform = 'translateX(110%)';
  v.style.opacity = '0';
  await sleep(460);
}

async function slideIn() {
  const v = $('#main .view');
  if (!v || reduce) return;
  v.style.transition = 'none';
  v.style.transform = 'translateX(110%)';
  v.style.opacity = '0';
  v.offsetWidth; // força reflow
  v.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1), opacity .5s ease-out';
  v.style.transform = 'none';
  v.style.opacity = '1';
  await sleep(620);
  v.style.cssText = ''; // não deixa transform/opacity residuais no layout
}

async function go() {
  if (busy) { queued = true; return; }
  busy = true;
  const k = getKey();
  await Promise.all([load(k), started ? slideOut() : Promise.race([document.fonts ? document.fonts.ready : 0, sleep(1000)])]);
  paint(k);
  window.scrollTo(0, 0);
  started = true;
  await slideIn();
  busy = false;
  if (queued) { queued = false; go(); }
}

/* ---------- idioma e tema ---------- */
function setLang(l) {
  lang = l;
  store.set('lang', l);
  document.documentElement.lang = l === 'pt' ? 'pt-BR' : 'en';
  document.querySelectorAll('.flag').forEach(b => {
    b.classList.toggle('on', b.dataset.lang === l);
    b.setAttribute('aria-pressed', b.dataset.lang === l);
  });
  if (D) { shell(); if (started && !busy) paint(key); }
}
document.querySelectorAll('.flag').forEach(b => b.onclick = () => setLang(b.dataset.lang));

$('#theme').onclick = () => {
  const r = document.documentElement;
  const n = r.dataset.theme === 'dark' ? 'light' : 'dark';
  r.dataset.theme = n;
  store.set('theme', n);
};

$('#burger').onclick = () => document.body.classList.toggle('menu');
$('#nav').onclick = e => {
  const b = e.target.closest('.t');
  if (!b) return;
  const g = b.parentElement, i = +g.dataset.i;
  g.classList.toggle('closed');
  g.classList.contains('closed') ? closed.add(i) : closed.delete(i);
  b.setAttribute('aria-expanded', !g.classList.contains('closed'));
};

/* ---------- início ---------- */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
// voltar/avançar do cache do navegador: garante que nada fique preso no meio da animação
addEventListener('pageshow', e => { if (e.persisted) { const v = $('#main .view'); if (v) v.style.cssText = ''; busy = false; } });
(async () => {
  try {
    D = await (await fetch('content/site.json')).json();
  } catch (e) {
    document.body.insertAdjacentHTML('afterbegin', '<p style="padding:30px">Não consegui carregar content/site.json. Abra o site por um servidor local (ex.: <code>python3 -m http.server</code>) ou publique-o.</p>');
    return;
  }
  D.nav.forEach((_, i) => closed.add(i)); // grupos do menu começam fechados
  setLang(lang);
  await go();
  addEventListener('hashchange', go);
})();
