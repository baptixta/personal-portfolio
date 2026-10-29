import { createRenderer, parsePath } from './render.mjs';

const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const store = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } }
};
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

/* links antigos (/#/pimbolas) -> URLs novas (/pimbolas/) */
const legacy = location.hash.match(/^#\/(.*)$/);
if (legacy) location.replace('/' + (legacy[1] ? legacy[1].replace(/\/$/, '') + '/' : ''));

/* idioma automático: só em URLs em português, só para quem não escolheu idioma e nunca para robôs de busca */
let { lang, key } = parsePath(location.pathname);
const bot = /bot|crawl|spider|slurp|lighthouse|pagespeed|headless/i.test(navigator.userAgent);
const saved = store.get('lang');
const wantsEn = saved === 'en' || (!saved && !(navigator.language || 'en').toLowerCase().startsWith('pt'));
const redirecting = !legacy && lang === 'pt' && !bot && wantsEn;
if (redirecting) location.replace('/en' + location.pathname + location.search);

if (!legacy && !redirecting) {
  let D, R, raf, busy = false, queued = false, cur = 0;
  const closed = new Set(), cache = {};

  // o HTML já veio pré-renderizado: os grupos fechados do menu refletem o que está na página
  const ready = fetch('/content/site.json').then(r => r.json()).then(d => {
    D = d; R = createRenderer(D, lang);
    document.querySelectorAll('#nav .grp.closed').forEach(g => closed.add(+g.dataset.i));
  });

  async function load(k) {
    if (!k || !D.pages[k]) return null;
    if (!cache[k]) {
      try {
        const p = await (await fetch('/' + D.pages[k])).json();
        // guia: as fichas do almanaque ficam num JSON à parte
        if (p.almanaque && p.almanaque.file) p.almanaque.refs = (await (await fetch('/' + p.almanaque.file)).json()).refs;
        cache[k] = p;
      } catch (e) { return null; }
    }
    return cache[k];
  }

  /* ---------- guia do game designer: abas, busca e filtros do almanaque, gaveta da ficha ---------- */
  const alm = { cat: '', tags: new Set(), q: '' };
  function tab(id, push) {
    const t = document.getElementById('tab-' + id);
    if (!t) return;
    document.querySelectorAll('.guia [role=tab]').forEach(b => {
      const on = b === t;
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
      document.getElementById(b.getAttribute('aria-controls')).hidden = !on;
    });
    if (push) history.replaceState(history.state, '', location.pathname + (id === 'guia' ? '' : '#' + id));
  }
  function filter() {
    const g = $('.alm-grid');
    if (!g) return;
    const words = alm.q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/\s+/).filter(Boolean);
    let n = 0;
    g.querySelectorAll('.ficha').forEach(f => {
      const tags = f.dataset.tags.split(' ');
      const ok = (!alm.cat || f.dataset.cat === alm.cat) && [...alm.tags].every(x => tags.includes(x)) && words.every(w => f.dataset.q.includes(w));
      f.hidden = !ok;
      n += ok;
    });
    $('.alm-empty').hidden = n > 0;
    document.querySelectorAll('.alm [data-cat]').forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === alm.cat));
    document.querySelectorAll('.alm [data-tag]').forEach(b => b.setAttribute('aria-pressed', alm.tags.has(b.dataset.tag)));
  }
  function openFicha(f) {
    const d = $('.alm-dlg');
    d.querySelector('.alm-body').innerHTML = f.querySelector('.ficha-full').innerHTML;
    d.showModal();
    d.querySelector('.alm-body').scrollTop = 0;
  }
  function guia() {
    if (!$('.guia')) return;
    alm.cat = ''; alm.tags.clear(); alm.q = '';
    tab(location.hash === '#almanaque' ? 'almanaque' : 'guia');
    const q = $('.alm-q');
    if (q) q.oninput = () => { alm.q = q.value; filter(); };
    const d = $('.alm-dlg');
    if (d) d.onclick = e => { if (e.target === d || e.target.closest('.alm-close')) d.close(); };
    // tilt leve nas fichas, seguindo o mouse
    if (!reduce) document.querySelectorAll('.ficha').forEach(f => {
      f.onpointermove = e => {
        const r = f.getBoundingClientRect();
        f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 8 + 'deg');
        f.style.setProperty('--rx', ((e.clientY - r.top) / r.height - .5) * -8 + 'deg');
      };
      f.onpointerleave = () => { f.style.removeProperty('--rx'); f.style.removeProperty('--ry'); };
    });
  }

  /* ---------- cartas estilo Balatro: flutuação idle + hover com tilt, escala e "juice" ---------- */
  function cards() {
    cancelAnimationFrame(raf);
    const a = reduce ? 0 : 1;
    const S = [];
    document.querySelectorAll('.hand').forEach((h, hi) => {
      const els = [...h.querySelectorAll('.card')];
      els.forEach((el, i) => S.push({ el, i, n: els.length, ph: i * 1.9 + hi * 3.1, hv: 0, over: 0, mx: 0, my: 0, rx: 0, ry: 0, t0: -1e9 }));
    });
    if (!S.length) return;
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
        const m = c.i - (c.n - 1) / 2;
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

  /* ---------- troca de página ---------- */
  function paint(k, p) {
    key = k;
    $('#side').innerHTML = R.shell(k, closed);
    $('#ctrl').innerHTML = R.ctrl(k);
    $('#main').innerHTML = R.view(k, p);
    document.documentElement.lang = R.htmlLang(lang);
    document.head.querySelectorAll('[data-seo]').forEach(e => e.remove());
    document.head.insertAdjacentHTML('beforeend', R.headHTML(k, p));
    document.body.classList.remove('menu');
    cards();
    guia();
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
    if (history.state == null) history.replaceState({ i: 0 }, '');
    cur = history.state.i;
    await ready;
    const { lang: l, key: k } = parsePath(location.pathname);
    if (l !== lang) { lang = l; R = createRenderer(D, lang); }
    const [p] = await Promise.all([load(k), slideOut()]);
    paint(p ? k : '', p);
    window.scrollTo(0, 0);
    await slideIn();
    busy = false;
    if (queued) { queued = false; go(); }
  }

  const navigate = path => {
    if (path === location.pathname) return;
    history.pushState({ i: cur + 1 }, '', path);
    go();
  };

  /* ---------- eventos (delegados, funcionam depois de cada troca de página) ---------- */
  document.addEventListener('click', e => {
    const theme = e.target.closest('#theme');
    if (theme) {
      const r = document.documentElement;
      const n = r.dataset.theme === 'dark' ? 'light' : 'dark';
      r.dataset.theme = n;
      store.set('theme', n);
      return;
    }
    if (e.target.closest('#burger')) { document.body.classList.toggle('menu'); return; }
    const b = e.target.closest('#nav .t');
    if (b) {
      const g = b.parentElement, i = +g.dataset.i;
      g.classList.toggle('closed');
      g.classList.contains('closed') ? closed.add(i) : closed.delete(i);
      b.setAttribute('aria-expanded', !g.classList.contains('closed'));
      return;
    }
    const tb = e.target.closest('.guia [role=tab]');
    if (tb) { tab(tb.dataset.tab, true); return; }
    const chip = e.target.closest('.alm .chip');
    if (chip) {
      if ('cat' in chip.dataset) alm.cat = chip.dataset.cat;
      else alm.tags.has(chip.dataset.tag) ? alm.tags.delete(chip.dataset.tag) : alm.tags.add(chip.dataset.tag);
      filter();
      return;
    }
    const f = e.target.closest('.ficha');
    if (f && !e.target.closest('a')) { openFicha(f); return; }
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.origin !== location.origin || a.hasAttribute('download')) return;
    if (a.dataset.lang) store.set('lang', a.dataset.lang);
    e.preventDefault();
    if (a.hasAttribute('data-back') && cur > 0) { history.back(); return; }
    navigate(a.pathname);
  });
  // teclado: Enter/Espaço abrem a ficha, setas trocam de aba
  document.addEventListener('keydown', e => {
    const f = e.target.closest && e.target.closest('.ficha');
    if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openFicha(f); return; }
    const tb = e.target.closest && e.target.closest('.guia [role=tab]');
    if (tb && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      const all = [...document.querySelectorAll('.guia [role=tab]')];
      const n = all[(all.indexOf(tb) + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
      tab(n.dataset.tab, true); n.focus();
    }
  });
  addEventListener('popstate', go);

  // voltar/avançar do cache do navegador: garante que nada fique preso no meio da animação
  addEventListener('pageshow', e => { if (e.persisted) { const v = $('#main .view'); if (v) v.style.cssText = ''; busy = false; } });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (history.state == null) history.replaceState({ i: 0 }, '');
  cur = history.state.i;
  cards(); // o conteúdo já está na página (pré-renderizado)
  guia();
}
