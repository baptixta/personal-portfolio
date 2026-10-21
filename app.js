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
      try { cache[k] = await (await fetch('/' + D.pages[k])).json(); } catch (e) { return null; }
    }
    return cache[k];
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
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.origin !== location.origin || a.hasAttribute('download')) return;
    if (a.dataset.lang) store.set('lang', a.dataset.lang);
    e.preventDefault();
    if (a.hasAttribute('data-back') && cur > 0) { history.back(); return; }
    navigate(a.pathname);
  });
  addEventListener('popstate', go);

  // voltar/avançar do cache do navegador: garante que nada fique preso no meio da animação
  addEventListener('pageshow', e => { if (e.persisted) { const v = $('#main .view'); if (v) v.style.cssText = ''; busy = false; } });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (history.state == null) history.replaceState({ i: 0 }, '');
  cur = history.state.i;
  cards(); // o conteúdo já está na página (pré-renderizado)
}
