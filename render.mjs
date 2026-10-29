/* Renderização compartilhada: roda no navegador (app.js) e no Node (build.mjs, que pré-renderiza
   cada página em HTML estático para os mecanismos de busca). */

// "/en/pimbolas/" -> { lang: 'en', key: 'pimbolas' } · "/" -> { lang: 'pt', key: '' }
export const parsePath = p => {
  const m = p.split('/').filter(s => s && s !== 'index.html');
  const lang = m[0] === 'en' ? (m.shift(), 'en') : 'pt';
  return { lang, key: m[0] || '' };
};

export function createRenderer(D, lang) {
  // qualquer texto no JSON pode ser "string" ou { "pt": "...", "en": "..." }
  const t = v => v && typeof v === 'object' && !Array.isArray(v) && ('pt' in v || 'en' in v) ? (v[lang] ?? v.pt ?? v.en) : v;
  const esc = s => String(t(s) ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // **texto** vira negrito (aplicado depois do escape, então é seguro)
  const rich = s => esc(s).replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>');
  const nl = s => rich(s).replace(/\n/g, '<br>');
  const isText = b => typeof b === 'string' || (b && ('pt' in b || 'en' in b));
  const arr = x => Array.isArray(x) ? x : x ? [x] : [];
  // caminhos relativos do JSON ("assets/x.png") viram absolutos ("/assets/x.png"), pois as páginas ficam em /en/jogo/
  const u = p => { p = String(t(p) ?? ''); return /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(p) ? p : '/' + p; };
  const site = D.site;
  const base = (site.url || '').replace(/\/$/, '');
  const fullName = site.name.map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  const href = (k = '', l = lang) => (l === 'en' ? '/en/' : '/') + (k ? k + '/' : '');
  const htmlLang = l => (l === 'en' ? 'en' : 'pt-BR');

  /* ---------- blocos ---------- */
  const social = () => site.social.map(s =>
    `<a href="${esc(s.url)}" target="_blank" rel="${/^https?:/.test(s.url) ? 'me noopener' : 'noopener'}" aria-label="${esc(s.name)}"><i style="--i:url(${esc(u('assets/' + s.icon))})"></i></a>`).join('');

  /* mão de cartas (animação Balatro): { img | src, alt | title, page?: "slug", url?: "https://..." } */
  const hand = list => {
    const cs = arr(list).filter(c => c && (c.img || c.src));
    if (!cs.length) return '';
    return `<div class="hand" style="--n:${cs.length}">${cs.map(c => {
      const alt = esc(c.alt || c.title || '');
      const img = `<img src="${esc(u(c.img || c.src))}" alt="${alt}" draggable="false">`;
      if (c.url) return `<a class="card" href="${esc(c.url)}" target="_blank" rel="noopener" aria-label="${alt}">${img}</a>`;
      if (c.page) return `<a class="card" href="${href(c.page)}" aria-label="${alt}">${img}</a>`;
      return `<div class="card nolink">${img}</div>`;
    }).join('')}</div>`;
  };

  /* imagem estática: { img | src, alt?, caption?, url?, width? } */
  const fig = c => {
    const src = c.img || c.src;
    if (!src) return '';
    const im = `<img src="${esc(u(src))}" alt="${esc(c.alt || '')}" loading="lazy">`;
    const body = c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${im}</a>` : im;
    return `<figure class="fig"${c.width ? ` style="max-width:${esc(c.width)}"` : ''}>${body}${c.caption ? `<figcaption>${rich(c.caption)}</figcaption>` : ''}</figure>`;
  };
  const gallery = list => {
    const g = arr(list).filter(c => c && (c.img || c.src));
    return g.length ? `<div class="gallery">${g.map(fig).join('')}</div>` : '';
  };

  /* grid de logos: { img | src, alt | name, url? } — sem img (ou se a imagem falhar) mostra o nome */
  const logos = list => {
    const g = arr(list).filter(Boolean);
    if (!g.length) return '';
    return `<div class="gallery logos">${g.map(c => {
      const name = esc(c.alt || c.name || ''), src = c.img || c.src;
      const inner = src
        ? `<img src="${esc(u(src))}" alt="${name}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:this.alt}))">`
        : `<span>${name}</span>`;
      return c.url
        ? `<a class="logo" href="${esc(c.url)}" target="_blank" rel="noopener" aria-label="${name}">${inner}</a>`
        : `<div class="logo">${inner}</div>`;
    }).join('')}</div>`;
  };

  const contact = () => `<section class="sec"><h2>${rich(D.contact.title)}</h2><p>${nl(D.contact.text)}</p><div class="social big">${social()}</div></section>`;
  const arrow = '<svg viewBox="0 0 10 14" width="10" height="14" aria-hidden="true"><path d="M7.5 1.5 2 7l5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const chevron = '<svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- estrutura fixa: barra lateral e controles ---------- */
  // closed: Set com os índices dos grupos fechados (sem Set = todos fechados)
  const shell = (key, closed) => `<div class="side-top"><a class="brand" href="${href()}"><img id="avatar" src="${esc(u(site.avatar))}" alt="${esc(fullName)}"><span id="name">${esc(site.name[0])} <b>${rich(site.name[1])}</b></span></a></div>
    <p id="bio">${nl(site.bio)}</p><div class="social" id="social-top">${social()}</div>
    <button id="burger">☰ ${esc(D.ui.menu)}</button>
    <nav id="nav" aria-label="${esc(D.ui.menu)}">${D.nav.map((g, i) => {
    const shut = closed ? closed.has(i) : true;
    return `<div class="grp${shut ? ' closed' : ''}" data-i="${i}"><button class="t" aria-expanded="${!shut}"><span>${rich(g.title)}</span>${chevron}</button>
      <div class="items"><div>${g.items.map(it => it.page
      ? `<a href="${href(it.page)}"${it.page === key ? ' class="active"' : ''}>${rich(it.label)}</a>`
      : `<a href="${esc(it.url)}" target="_blank" rel="noopener">${rich(it.label)}</a>`).join('')}</div></div></div>`;
  }).join('')}</nav>`;

  const ctrl = key => ['pt', 'en'].map(l =>
    `<a class="flag${lang === l ? ' on' : ''}" data-lang="${l}" href="${href(key, l)}" hreflang="${htmlLang(l)}" lang="${htmlLang(l)}" aria-label="${l === 'pt' ? 'Português' : 'English'}"${lang === l ? ' aria-current="true"' : ''}><img src="/assets/flag-${l === 'pt' ? 'br' : 'us'}.svg" alt=""></a>`).join('')
    + '<button id="theme" aria-label="tema / theme"><i></i></button>';

  /* ---------- páginas ---------- */
  const home = () => {
    const h = D.home;
    // logo quadrado ao lado do nome: por linha ("logo") ou pelo nome da empresa em home.logos
    const secs = h.sections.map(s => {
      const rows = s.rows.map(r => {
        r = Array.isArray(r) ? { cols: r } : r;
        const name = String(t(r.cols[0]) ?? '');
        return { ...r, name, logo: r.logo || (h.logos || {})[name] };
      });
      const has = rows.some(r => r.logo); // reserva o espaço do logo em todas as linhas da seção
      const body = rows.map(r => {
        const cells = r.cols.map((x, i) => {
          if (i || !has) return `<span>${rich(x)}</span>`;
          const sq = r.logo
            ? `<img class="sq" src="${esc(u(r.logo))}" alt="${esc(r.name)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'sq',textContent:this.alt.charAt(0)}))">`
            : '<span class="sq ghost" aria-hidden="true"></span>';
          return `<span class="co">${sq}<span>${rich(x)}</span></span>`;
        }).join('');
        return r.url
          ? `<a class="row c${r.cols.length}" href="${esc(r.url)}" target="_blank" rel="noopener">${cells}</a>`
          : `<div class="row c${r.cols.length}">${cells}</div>`;
      }).join('');
      return `<section class="sec${has ? ' has-logo' : ''}"><h2>${rich(s.title)}</h2>${body}</section>`;
    }).join('');
    return `<div class="page"><h1 class="sr-only">${esc((h.seo && h.seo.h1) || fullName)}</h1>${hand(h.cards)}${secs}${contact()}</div>`;
  };

  const page = p => {
    const T = esc(p.title);
    const vid = id => id ? `<div class="video"><iframe src="${/^https?:/.test(id) ? esc(id) : 'https://www.youtube-nocookie.com/embed/' + esc(id)}" allowfullscreen loading="lazy" title="${T} — video"></iframe></div>` : '';
    const blk = b => isText(b) ? `<p>${nl(b)}</p>`
      : b.cards ? hand(b.cards)
      : b.list ? `<div class="resp list">${b.list.map(i => `<span>${rich(i)}</span>`).join('')}</div>`
      : b.logos ? logos(b.logos)
      : b.gallery ? gallery(b.gallery)
      : (b.img || b.src) ? fig(b) : vid(b.video);
    const links = arr(p.links).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${rich(l.label)} ↗</a>`).join('');
    const shots = arr(p.screenshots).map((s, i) => `<a href="${esc(u(s))}" target="_blank" rel="noopener"><img src="${esc(u(s))}" alt="${T} — ${lang === 'pt' ? 'captura de tela' : 'screenshot'} ${i + 1}" loading="lazy"></a>`).join('');
    const resp = arr(p.responsabilidades).map(r => `<div class="resp">${rich(r.title)}${r.items.map(i => `<span>${rich(i)}</span>`).join('')}</div>`).join('');
    return `<div class="page"><h1 class="back"><a href="${href()}" data-back>${arrow}<span>${rich(p.title)}</span></a></h1>${hand(p.cards)}${gallery(p.gallery)}${logos(p.logos)}${vid(p.trailer)}
    ${links ? `<div class="links">${links}</div>` : ''}
    ${shots ? `<div class="shots">${shots}</div>` : ''}
    ${p.description ? `<p class="desc">${nl(p.description)}</p>` : ''}
    ${resp ? `<section class="sec"><h2 class="sub">${rich(D.ui.resp)}</h2>${resp}</section>` : ''}
    ${arr(p.sections).map(s => `<section class="sec"><h2 class="sub">${rich(s.title)}</h2>${arr(s.blocks).map(blk).join('')}${gallery(s.gallery)}${logos(s.logos)}${hand(s.cards || s.images)}</section>`).join('')}
    ${contact()}</div>`;
  };

  /* ---------- guia do game designer (conteúdo vem do repo baptixta/guia-do-game-designer) ---------- */
  // lista aninhada: [ "texto" | { text, list: [...] } ]
  const ulist = l => `<ul>${arr(l).map(i => typeof i === 'object' && !isText(i)
    ? `<li>${rich(i.text)}${i.list ? ulist(i.list) : ''}</li>` : `<li>${rich(i)}</li>`).join('')}</ul>`;
  // notas das fichas: "## título" vira subtítulo, "- item" vira lista, o resto vira parágrafo
  const prose = s => {
    let h = '', ul = false, para = [];
    const flush = () => { if (para.length) { h += `<p>${rich(para.join(' '))}</p>`; para = []; } };
    const close = () => { if (ul) { h += '</ul>'; ul = false; } };
    for (const raw of String(t(s) ?? '').split(/\r?\n/)) {
      const l = raw.trim();
      if (!l) { flush(); close(); }
      else if (l.startsWith('## ')) { flush(); close(); h += `<h4>${rich(l.slice(3))}</h4>`; }
      else if (/^[-*•] /.test(l)) { flush(); if (!ul) { h += '<ul>'; ul = true; } h += `<li>${rich(l.slice(2))}</li>`; }
      else { close(); para.push(l); }
    }
    flush(); close();
    return h;
  };
  const host = x => { try { return new URL(x).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
  const norm = s => String(t(s) ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const guia = p => {
    const L = Object.assign({
      guia: lang === 'pt' ? 'guia' : 'guide', almanaque: lang === 'pt' ? 'almanaque' : 'almanac', related: lang === 'pt' ? 'conteúdos relacionados' : 'related content',
      search: lang === 'pt' ? 'buscar por chefe, jogo, mecânica…' : 'search by boss, game, mechanic…',
      all: lang === 'pt' ? 'todas' : 'all', empty: lang === 'pt' ? 'nada encontrado. tente outro termo ou limpe os filtros.' : 'nothing found. try another term or clear the filters.',
      links: lang === 'pt' ? 'vídeos, artigos e prints' : 'videos, articles and screenshots', close: lang === 'pt' ? 'voltar' : 'back'
    }, p.ui, p.tabs);
    const topic = tp => `<details class="topic"><summary><span>${rich(tp.title)}</span>${chevron}</summary><div class="topic-body">
      ${arr(tp.text).map(x => `<p>${nl(x)}</p>`).join('')}${tp.list ? ulist(tp.list) : ''}
      ${arr(tp.links).length ? `<h3>${rich(L.related)}</h3><div class="reflinks">${arr(tp.links).map(l =>
        `<a class="row c2" href="${esc(l.url)}" target="_blank" rel="noopener"><span>${rich(l.label)}</span><span>${rich(l.type || host(l.url))}</span></a>`).join('')}</div>` : ''}
    </div></details>`;
    // cada nível é um dropdown (fechado), com os tópicos dentro
    const levels = arr(p.levels).map(lv => `<section class="nivel"><details><summary><h2>${rich(lv.title)}${lv.subtitle ? ` <span>· ${rich(lv.subtitle)}</span>` : ''}</h2>${chevron}</summary><div class="nivel-body">${arr(lv.topics).map(topic).join('')}</div></details></section>`).join('');
    const c = p.cta;
    const cta = c ? `<section class="sec"><h2>${rich(c.title)}</h2>${c.text ? `<p>${nl(c.text)}</p>` : ''}${c.video ? `<div class="video"><iframe src="${/^https?:/.test(c.video) ? esc(c.video) : 'https://www.youtube-nocookie.com/embed/' + esc(c.video)}" allowfullscreen loading="lazy" title="${esc(c.title)}"></iframe></div>` : ''}${c.button ? `<div class="links"><a href="${esc(c.button.url)}" target="_blank" rel="noopener">${rich(c.button.label)} ↗</a></div>` : ''}</section>` : '';

    const A = p.almanaque || {};
    // categoria e tags também podem vir como { pt, en } (tags: { pt: [...], en: [...] })
    const cat = r => String(t(r.category) || '—'), tagsOf = r => arr(t(r.tags));
    const refs = arr(A.refs).slice().sort((a, b) => norm(a.category).localeCompare(norm(b.category)) || norm(a.title).localeCompare(norm(b.title)));
    const count = (list, f) => list.reduce((m, r) => (arr(f(r)).forEach(k => m.set(k, (m.get(k) || 0) + 1)), m), new Map());
    const cats = [...count(refs, cat)].sort((a, b) => a[0].localeCompare(b[0]));
    const tags = [...count(refs, tagsOf)].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    // descrições: lista [{ name, text }] ou objeto { "nome": "texto" }
    const catdesc = Array.isArray(A.categories) ? A.categories.map(c => [String(t(c.name)), c.text]) : Object.entries(A.categories || {});
    const ficha = r => {
      const links = arr(r.links).filter(l => /^https?:\/\//i.test(l.url || ''));
      const tg = tagsOf(r).map(x => `<span class="tag">#${esc(x)}</span>`).join('');
      return `<article class="ficha" tabindex="0" role="button" aria-haspopup="dialog" data-cat="${esc(cat(r))}" data-tags="${esc(tagsOf(r).join(' '))}" data-q="${esc(norm([t(r.title), t(r.game), cat(r), t(r.summary), t(r.body), tagsOf(r).join(' ')].join(' ')))}">
        <span class="cap">${esc(r.game || r.category || '')}</span><h3>${rich(r.title)}</h3>${r.summary ? `<p>${rich(r.summary)}</p>` : ''}<span class="tags">${tg}</span>
        <div class="ficha-full" hidden><span class="cap">${esc(r.category || '')}</span><h2 class="ficha-t">${rich(r.title)}</h2>${r.game ? `<span class="cap">${esc(r.game)}</span>` : ''}
          <div class="tags">${tg}</div>${r.summary ? `<p class="summary">${rich(r.summary)}</p>` : ''}<div class="prose">${prose(r.body)}</div>
          ${links.length ? `<div class="reflinks"><h4>${rich(L.links)}</h4>${links.map(l => `<a class="row c2" href="${esc(l.url)}" target="_blank" rel="noopener"><span>${rich(l.label || host(l.url))}</span><span>${esc(host(l.url))}</span></a>`).join('')}</div>` : ''}
        </div></article>`;
    };
    const chip = (kind, val, label, n, on) => `<button class="chip" data-${kind}="${esc(val)}" aria-pressed="${!!on}">${label}${n != null ? ` <small>${n}</small>` : ''}</button>`;
    const alm = `<div class="alm">${A.intro ? `<p class="desc">${nl(A.intro)}</p>` : ''}
      <input class="alm-q" type="search" placeholder="${esc(L.search)}" aria-label="${esc(L.search)}">
      <div class="chips">${chip('cat', '', esc(L.all), refs.length, true)}${cats.map(([k, n]) => chip('cat', k, esc(k), n)).join('')}</div>
      ${tags.length ? `<details class="tagbox"><summary>tags ${chevron}</summary><div class="chips tagchips">${tags.map(([k]) => chip('tag', k, '#' + esc(k))).join('')}</div></details>` : ''}
      ${catdesc.map(([k, v]) => `<p class="alm-catdesc" data-for="${esc(k)}" hidden>${nl(v)}</p>`).join('')}
      <div class="alm-grid">${refs.map(ficha).join('')}</div>
      <p class="alm-empty" hidden>${rich(L.empty)}</p>
      <dialog class="alm-dlg" aria-label="${esc(L.almanaque)}"><div class="alm-bar"><button class="alm-close">${arrow}<span>${rich(L.close)}</span></button></div><div class="alm-body"></div></dialog></div>`;

    const tab = (id, label, on) => `<button role="tab" id="tab-${id}" aria-controls="aba-${id}" aria-selected="${on}" data-tab="${id}"${on ? '' : ' tabindex="-1"'}>${rich(label)}</button>`;
    return `<div class="page guia"><h1 class="back"><a href="${href()}" data-back>${arrow}<span>${rich(p.title)}</span></a></h1>
    ${p.intro ? `<p class="desc">${nl(p.intro)}</p>` : ''}
    <div class="tabs" role="tablist">${tab('guia', L.guia, true)}${refs.length ? tab('almanaque', L.almanaque, false) : ''}</div>
    <div class="aba" id="aba-guia" role="tabpanel" aria-labelledby="tab-guia">${levels}${cta}</div>
    ${refs.length ? `<div class="aba" id="aba-almanaque" role="tabpanel" aria-labelledby="tab-almanaque" hidden>${alm}</div>` : ''}
    ${contact()}</div>`;
  };

  const view = (key, p) => `<div class="view">${p ? (p.levels ? guia(p) : page(p)) : home()}</div>`;

  /* ---------- SEO ---------- */
  const plain = x => String(t(x) ?? '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  const clip = (s, n = 160) => s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';

  const seo = (key, p) => {
    const S = (key ? p && p.seo : D.home.seo) || {};
    const ss = site.seo || {};
    const firstText = () => { if (p && p.intro) return plain(p.intro); for (const s of arr(p && p.sections)) for (const b of arr(s.blocks)) if (isText(b)) return plain(b); return ''; };
    const title = plain(S.title) || (key ? `${plain(p.title)} | ${fullName}` : fullName);
    const desc = clip(plain(S.description) || plain(p && p.description) || firstText() || plain(site.bio));
    const url = base + href(key);
    const card = D.home.cards.find(c => c.page === key);
    const image = base + u(S.image || (card && card.img) || ss.image || site.avatar);
    const inLanguage = htmlLang(lang);
    const personId = base + '/#person';
    const sameAs = site.social.map(s => s.url).filter(x => /^https?:/.test(x) && !/SEU-/i.test(x));
    const g = [{
      '@type': 'Person', '@id': personId, name: fullName, alternateName: ss.alternateNames, url: base + '/',
      image: base + u(site.avatar), jobTitle: 'Game designer', description: plain(D.home.seo && D.home.seo.description) || plain(site.bio),
      worksFor: { '@type': 'Organization', name: 'Nano Knight Studio' },
      affiliation: { '@type': 'CollegeOrUniversity', name: 'FIAP' },
      knowsAbout: ss.knowsAbout, sameAs
    }];
    if (!key) {
      g.push({ '@type': 'WebSite', '@id': base + '/#website', url: base + '/', name: fullName, inLanguage, publisher: { '@id': personId } });
    } else {
      g.push({ '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: lang === 'pt' ? 'início' : 'home', item: base + href() },
        { '@type': 'ListItem', position: 2, name: plain(p.title), item: url }] });
      if (S.type === 'service') g.push({ '@type': 'ProfessionalService', name: plain(p.title), description: desc, url, image, inLanguage, provider: { '@id': personId }, serviceType: 'Game design consulting', areaServed: 'Worldwide' });
      else if (p && 'trailer' in p) g.push({ '@type': 'VideoGame', name: plain(p.title), description: desc, url, image, inLanguage, contributor: { '@id': personId }, sameAs: arr(p.links).map(l => l.url) });
      else if (p && p.levels) g.push({ '@type': 'LearningResource', name: plain(p.title), description: desc, url, image, inLanguage: 'pt-BR', isAccessibleForFree: true, learningResourceType: 'guide', teaches: 'game design', author: { '@id': personId } });
      else if (key === 'sobre') g.push({ '@type': 'ProfilePage', url, name: title, inLanguage, mainEntity: { '@id': personId } });
    }
    return { title, desc, url, image, ld: { '@context': 'https://schema.org', '@graph': g } };
  };

  // tags do <head> geridas por nós (data-seo): o app.js troca todas elas a cada navegação
  const headHTML = (key, p) => {
    const i = seo(key, p), a = x => esc(x);
    const alt = l => base + href(key, l);
    return [
      `<title data-seo>${a(i.title)}</title>`,
      `<meta data-seo name="description" content="${a(i.desc)}">`,
      `<link data-seo rel="canonical" href="${a(i.url)}">`,
      `<link data-seo rel="alternate" hreflang="pt-BR" href="${a(alt('pt'))}">`,
      `<link data-seo rel="alternate" hreflang="en" href="${a(alt('en'))}">`,
      `<link data-seo rel="alternate" hreflang="x-default" href="${a(alt('pt'))}">`,
      `<meta data-seo property="og:type" content="website">`,
      `<meta data-seo property="og:site_name" content="${a(fullName)}">`,
      `<meta data-seo property="og:title" content="${a(i.title)}">`,
      `<meta data-seo property="og:description" content="${a(i.desc)}">`,
      `<meta data-seo property="og:url" content="${a(i.url)}">`,
      `<meta data-seo property="og:image" content="${a(i.image)}">`,
      `<meta data-seo property="og:locale" content="${lang === 'pt' ? 'pt_BR' : 'en_US'}">`,
      `<meta data-seo property="og:locale:alternate" content="${lang === 'pt' ? 'en_US' : 'pt_BR'}">`,
      `<meta data-seo name="twitter:card" content="summary_large_image">`,
      `<meta data-seo name="twitter:title" content="${a(i.title)}">`,
      `<meta data-seo name="twitter:description" content="${a(i.desc)}">`,
      `<meta data-seo name="twitter:image" content="${a(i.image)}">`,
      `<script data-seo type="application/ld+json">${JSON.stringify(i.ld).replace(/</g, '\\u003c')}</script>`
    ].join('\n');
  };

  return { lang, t, esc, href, htmlLang, shell, ctrl, home, page, view, seo, headHTML, fullName, base };
}
