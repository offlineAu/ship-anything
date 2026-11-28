#!/usr/bin/env node
// Generates the README images in assets/readme/ (light and dark variants) from brand tokens
// (docs/branding/brand-guidelines.md §5) and, for the terminal frame, a real captured log
// (assets/readme/init-terminal.log). Usage: node scripts/generate/readme-assets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'assets/readme');

const THEMES = {
  light: { bg: '#FAFAF7', surface: '#FFFFFF', surface2: '#F0F0EB', border: '#D6D6CF', strong: '#787E87',
    text: '#14161A', muted: '#525861', accent: '#B4410C', onAccent: '#FFFFFF', success: '#166534', info: '#0E7490', warning: '#854D0E' },
  dark: { bg: '#0D0F12', surface: '#15181D', surface2: '#1D2127', border: '#2C323A', strong: '#6B7480',
    text: '#ECEDEE', muted: '#9BA3AD', accent: '#FF7A3D', onAccent: '#0D0F12', success: '#4ADE80', info: '#22D3EE', warning: '#FACC15' },
};
const SANS = `font-family="'IBM Plex Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const DISPLAY = `font-family="Archivo, 'IBM Plex Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const MONO = `font-family="'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (w, h, title, desc, body, t) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" rx="16" fill="${t.bg}"/>
${body}
</svg>
`;

// Wave mark (brand concept A): offset bars moving left to right, closing on a vertical gate line.
function waveMark(x, y, t, s = 1) {
  const bars = [[0, 0, 70], [22, 26, 86], [44, 52, 70], [10, 78, 92]];
  const b = bars.map(([dx, dy, w], i) =>
    `<rect x="${x + dx * s}" y="${y + dy * s}" width="${w * s}" height="${14 * s}" rx="${3 * s}" fill="${i === 2 ? t.accent : t.text}"/>`).join('');
  return `${b}<rect x="${x + 150 * s}" y="${y - 8 * s}" width="${5 * s}" height="${108 * s}" rx="${2 * s}" fill="${t.accent}"/>`;
}

function hero(t) {
  const body = `
<rect x="1" y="1" width="958" height="318" rx="15" fill="none" stroke="${t.border}"/>
<text x="56" y="92" ${MONO} font-size="14" fill="${t.muted}" letter-spacing="1">npx ship-anything init</text>
<text x="56" y="168" ${DISPLAY} font-size="66" font-weight="800" fill="${t.text}" letter-spacing="-1">SHIP ANYTHING</text>
<text x="56" y="214" ${SANS} font-size="24" font-weight="600" fill="${t.text}">Your AI Product Studio.</text>
<text x="56" y="250" ${SANS} font-size="20" fill="${t.muted}">Build Anything. Ship Everything.</text>
<text x="56" y="286" ${MONO} font-size="13" fill="${t.muted}">22 agents · 63 skills · 15 workflows · Claude Code · Codex · OpenCode · Cursor · Gemini CLI</text>
${waveMark(700, 110, t, 1.1)}`;
  return svg(960, 320, 'SHIP ANYTHING: Your AI Product Studio', 'Wordmark, tagline and the wave mark: offset bars that end at a gate line.', body, t);
}

function howItWorks(t) {
  const W = 960, top = 70;
  const cols = [
    { x: 24, w: 150, head: 'You', lines: ['describe what', 'you want, in', 'plain words'], color: t.text },
    { x: 196, w: 160, head: 'Orchestrator', lines: ['sizes it L1–L4,', 'picks workflows,', 'writes plan.yaml'], color: t.accent },
    { x: 378, w: 176, head: 'Specialists', lines: ['frontend · backend', 'database · ux · 3D', 'work in parallel'], color: t.info },
    { x: 576, w: 172, head: 'Quality gates', lines: ['QA re-runs tests,', 'security, perf —', 'evidence required'], color: t.success },
    { x: 770, w: 166, head: 'You approve', lines: ['push, deploy,', 'publish or pay', 'only with your OK'], color: t.warning },
  ];
  const boxes = cols.map((c, i) => `
<g>
<rect x="${c.x}" y="${top}" width="${c.w}" height="168" rx="12" fill="${t.surface}" stroke="${t.border}"/>
<rect x="${c.x}" y="${top}" width="${c.w}" height="5" rx="2" fill="${c.color}"/>
<text x="${c.x + 16}" y="${top + 34}" ${MONO} font-size="12" fill="${t.muted}">${i + 1}</text>
<text x="${c.x + 16}" y="${top + 62}" ${SANS} font-size="18" font-weight="700" fill="${t.text}">${esc(c.head)}</text>
${c.lines.map((l, j) => `<text x="${c.x + 16}" y="${top + 96 + j * 22}" ${SANS} font-size="14" fill="${t.muted}">${esc(l)}</text>`).join('')}
</g>`).join('');
  const arrows = cols.slice(0, -1).map((c, i) => {
    const x1 = c.x + c.w + 3, x2 = cols[i + 1].x - 3, y = top + 84;
    return `<path d="M${x1} ${y} H${x2 - 6}" stroke="${t.strong}" stroke-width="2"/><path d="M${x2 - 8} ${y - 5} L${x2} ${y} L${x2 - 8} ${y + 5} Z" fill="${t.strong}"/>`;
  }).join('');
  const loop = `<path d="M662 ${top + 172} V${top + 196} H466 V${top + 176}" fill="none" stroke="${t.strong}" stroke-width="1.5" stroke-dasharray="4 4"/>
<path d="M461 ${top + 182} L466 ${top + 172} L471 ${top + 182} Z" fill="${t.strong}"/>
<text x="476" y="${top + 214}" ${SANS} font-size="13" fill="${t.muted}">failed check → back to the specialist with the evidence</text>`;
  const body = `
<text x="24" y="44" ${SANS} font-size="20" font-weight="700" fill="${t.text}">How a request flows</text>
${boxes}${arrows}${loop}
<rect x="24" y="${top + 236}" width="${W - 48}" height="48" rx="10" fill="${t.surface2}"/>
<text x="44" y="${top + 266}" ${SANS} font-size="14" fill="${t.text}">Everything is written to <tspan ${MONO} font-size="13" fill="${t.accent}">.ship-anything/state/</tspan> — plan, decisions, task reports — so any session can resume.</text>`;
  return svg(W, 370, 'How a SHIP ANYTHING request flows',
    'Five steps left to right: you describe the goal; the orchestrator sizes it and plans; specialists build in parallel; quality gates verify with evidence and send failures back; you approve any push, deploy, publish or payment.', body, t);
}

function terminal(t) {
  const lines = fs.readFileSync(path.join(out, 'init-terminal.log'), 'utf8').trimEnd().split('\n');
  const lh = 21, top = 64, h = top + lines.length * lh + 28;
  const color = (l) => l.startsWith('$') ? t.text : l.startsWith('✔') ? t.success : l.trim().startsWith('create') ? t.text : t.muted;
  const rows = lines.map((l, i) => {
    const y = top + 14 + i * lh;
    const m = l.match(/^(\s+)(create)(\s+)(.*)$/);
    const content = l.startsWith('$')
      ? `<tspan fill="${t.accent}">$</tspan>${esc(l.slice(1))}`
      : m ? `${m[1]}<tspan fill="${t.success}">${m[2]}</tspan>${m[3]}${esc(m[4])}` : esc(l);
    return `<text x="28" y="${y}" ${MONO} font-size="13.5" fill="${color(l)}" xml:space="preserve">${content}</text>`;
  }).join('\n');
  const body = `
<rect x="12" y="12" width="936" height="${h - 24}" rx="12" fill="${t.surface}" stroke="${t.border}"/>
<circle cx="36" cy="36" r="6" fill="${t.border}"/><circle cx="56" cy="36" r="6" fill="${t.border}"/><circle cx="76" cy="36" r="6" fill="${t.border}"/>
<text x="480" y="41" text-anchor="middle" ${MONO} font-size="12" fill="${t.muted}">~/my-app</text>
<line x1="12" y1="54" x2="948" y2="54" stroke="${t.border}"/>
${rows}`;
  return svg(960, h, 'ship-anything init output',
    'Real output of npx ship-anything init --agent claude --yes in a new project: 196 files created, 0 conflicts, with an undo command.', body, t);
}

for (const [name, fn] of Object.entries({ hero, 'how-it-works': howItWorks, 'init-terminal': terminal })) {
  for (const theme of Object.keys(THEMES)) {
    fs.writeFileSync(path.join(out, `${name}-${theme}.svg`), fn(THEMES[theme]));
  }
}
console.log('wrote', fs.readdirSync(out).filter((f) => f.endsWith('.svg')).join(', '));
