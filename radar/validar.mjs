/* radar de eventos: regras para os eventos enviados pelo formulário "cadastrar evento".
   usado pelo worker (antes de publicar) e pelo build.mjs (um evento fora das regras nunca vai para o ar).
   sem dependências: roda no Node e no Cloudflare Workers. */

export const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
export const ONLINE = 'online';
const MAX = { a: 80, n: 120, v: 80, c: 60, u: 300 };
const DIA = 864e5;

// encurtadores escondem o destino real do link
const ENCURTADORES = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'cutt.ly', 'is.gd', 'ow.ly', 'rebrand.ly', 'shorturl.at', 'encurtador.com.br', 'abre.ai', 'tiny.cc', 'rb.gy', 's.id'];
// palavras que nunca deveriam aparecer num evento de games (a checagem com IA no worker pega o resto)
const PROIBIDAS = /\b(porn\w*|xxx|nude?s|onlyfans|cassino|casino|bets|apostas?|tigrinho|forex|bitcoin|cripto\w*|crypto\w*|viagra|empr[eé]stimos?)\b/i;

const limpa = v => String(v ?? '').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, ' ').replace(/\s+/g, ' ').trim();
const isoOk = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
const dia = s => Date.parse(s + 'T00:00:00Z');
const chave = s => limpa(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
export const hojeSP = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

/* do formulário para o formato do eventos.json; só os campos conhecidos passam */
export function normalizar(f) {
  const online = f.modalidade === ONLINE;
  const e = { t: 'indie', d: limpa(f.d) };
  if (f.ate && limpa(f.ate) !== e.d) e.ate = limpa(f.ate);
  e.a = limpa(f.a);
  if (limpa(f.n)) e.n = limpa(f.n);
  e.v = online ? ONLINE : limpa(f.v);
  e.c = online ? ONLINE : limpa(f.c);
  e.uf = online ? ONLINE : limpa(f.uf).toUpperCase();
  // "14:30" (campo de hora do navegador) vira "14h30", como no resto do radar
  const h = limpa(f.h).match(/^(\d{1,2})(?::|h)?(\d{2})?$/);
  if (h) e.h = `${+h[1]}h${h[2] && h[2] !== '00' ? h[2] : ''}`;
  else if (limpa(f.h)) e.h = limpa(f.h); // inválido: a validação recusa
  if (f.free === true || f.free === 'on' || f.free === 'true') e.free = true;
  e.u = limpa(f.u);
  e.via = 'comunidade';
  return e;
}

function checaLink(u) {
  if (u.length > MAX.u) return 'o link é longo demais';
  let url;
  try { url = new URL(u); } catch (err) { return 'o link não é um endereço válido'; }
  if (url.protocol !== 'https:') return 'o link precisa começar com https://';
  if (url.username || url.password || url.port) return 'o link tem um formato suspeito';
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':') || host.endsWith('.local') || host === 'localhost') return 'o link precisa ser de um site público';
  if (ENCURTADORES.some(d => host === d || host.endsWith('.' + d))) return 'use o link completo, sem encurtador';
  return '';
}

function checaTexto(nome, v, max, obrigatorio) {
  if (!v) return obrigatorio ? `preencha ${nome}` : '';
  if (v.length > max) return `${nome}: no máximo ${max} caracteres`;
  if (obrigatorio && v.length < 2) return `${nome}: curto demais`;
  if (/[<>{}\\`]/.test(v)) return `${nome}: tire os símbolos < > { } \\ \``;
  if (/https?:|www\.|\.(com|net|org|io|gg|br|xyz)\b\/?/i.test(v)) return `${nome}: links vão só no campo "link oficial"`;
  if (/(.)\1{5,}/u.test(v)) return `${nome}: tem caracteres repetidos demais`;
  if (PROIBIDAS.test(v)) return `${nome}: tem um termo que o radar não aceita`;
  return '';
}

/* devolve a lista de problemas (vazia = ok). hoje: data em São Paulo, "aaaa-mm-dd" */
export function validar(e, hoje = hojeSP()) {
  const erros = [];
  const push = m => m && erros.push(m);
  push(checaTexto('o nome do evento', e.a, MAX.a, true));
  if (e.a && e.a.length < 3) push('o nome do evento: curto demais');
  push(checaTexto('a descrição', e.n, MAX.n, false));
  if (e.uf === ONLINE) {
    if (e.v !== ONLINE || e.c !== ONLINE) push('evento online não leva local nem cidade');
  } else {
    push(checaTexto('o local', e.v, MAX.v, true));
    push(checaTexto('a cidade', e.c, MAX.c, true));
    if (!UFS.includes(e.uf)) push('escolha o estado');
  }
  if (!isoOk(e.d)) push('informe a data de início');
  else {
    if (dia(e.d) < dia(hoje)) push('a data de início já passou');
    if (dia(e.d) > dia(hoje) + 730 * DIA) push('o radar só aceita eventos nos próximos 2 anos');
    if (e.ate !== undefined) {
      if (!isoOk(e.ate)) push('a data de término é inválida');
      else if (dia(e.ate) < dia(e.d)) push('o término vem antes do início');
      else if (dia(e.ate) > dia(e.d) + 60 * DIA) push('o evento pode durar no máximo 60 dias');
    }
  }
  if (e.h !== undefined) {
    const m = /^(\d{1,2})h(\d{2})?$/.exec(e.h);
    if (!m || +m[1] > 23 || (m[2] && +m[2] > 59)) push('o horário é inválido');
  }
  if (e.free !== undefined && e.free !== true) push('campo "gratuito" inválido');
  if (!e.u) push('informe o link oficial');
  else push(checaLink(e.u));
  if (e.t !== 'indie' || e.via !== 'comunidade') push('formato de evento inválido');
  const conhecidos = ['t', 'd', 'ate', 'a', 'n', 'v', 'c', 'uf', 'h', 'free', 'u', 'via'];
  if (Object.keys(e).some(k => !conhecidos.includes(k))) push('o evento tem campos desconhecidos');
  return erros;
}

/* já está no radar? mesmo link, ou mesmo nome na mesma data */
export function duplicado(e, eventos) {
  const link = s => s.replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
  return eventos.find(x => (x.u && link(x.u) === link(e.u) && x.d === e.d) || (chave(x.a) === chave(e.a) && x.d === e.d));
}

/* uma linha no mesmo estilo do arquivo: { "t": "indie", "d": "...", ... } */
export const linha = e => '{ ' + Object.entries(e).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ') + ' }';

/* acrescenta o evento no fim da lista "eventos" sem reformatar o resto do arquivo (o arquivo é editado à mão) */
export function inserir(texto, e) {
  const antes = JSON.parse(texto);
  const m = /("eventos"\s*:\s*\[[\s\S]*?\})(\s*\n(\s*)\])/.exec(texto);
  let novo = m ? texto.slice(0, m.index) + m[1] + ',\n    ' + linha(e) + m[2] + texto.slice(m.index + m[0].length) : '';
  // se o arquivo mudou de formato, reescreve formatado em vez de arriscar um JSON quebrado
  try {
    const depois = JSON.parse(novo);
    const ok = depois.eventos.length === antes.eventos.length + 1 && JSON.stringify(depois.eventos.at(-1)) === JSON.stringify(e)
      && JSON.stringify({ ...depois, eventos: depois.eventos.slice(0, -1) }) === JSON.stringify(antes);
    if (!ok) throw new Error();
  } catch (err) {
    novo = JSON.stringify({ ...antes, eventos: [...antes.eventos, e] }, null, 2) + '\n';
  }
  return novo;
}
