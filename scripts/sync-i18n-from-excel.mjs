/**
 * Sync uiTextZhCN / uiTextZhTW from 產品多语言文檔 Excel.
 * Nav + module menus: keep English keys, zh-tw only.
 * Other sections: align en-us + zh-tw by zh-cn match; apply casing rules.
 *
 * Usage: node scripts/sync-i18n-from-excel.mjs [xlsxPath]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const xlsxPath =
  process.argv[2] ??
  '/Users/DanBaby/Downloads/產品多语言文檔_源文檔-不要動 🔒.xlsx';
const catalogPath = path.join(root, 'src/i18n/uiTextZhCN.ts');
const twOut = path.join(root, 'src/i18n/uiTextZhCN.ts');
const twPath = path.join(root, 'src/i18n/uiTextZhTW.ts');
const reportPath = path.join(root, 'src/i18n/i18n-alignment-report.json');

const NAV_MENU_SECTIONS = new Set([
  'Nav & module titles',
  'Tasks module menu',
  'Account settings menu',
  'Payment Engine menu',
  'Notifications menu',
  'Manage menu',
  'WaaS menu',
]);

const PROPER_NOUNS = new Set([
  'cregis',
  'bitcoin',
  'ethereum',
  'tron',
  'ton',
  'xrp',
  'metamask',
  'unichain',
  'swap',
  'english',
  'txid',
]);

const ACRONYMS = new Set([
  'api',
  'mpc',
  'trx',
  'eth',
  'btc',
  'usd',
  'usdt',
  'bnb',
  'evm',
  'gas',
  'max',
  'ip',
  'memo',
  'cspn',
  'aml',
  'waas',
  'id',
  'bsc',
  'defi',
  'nft',
  'hms',
  'mm',
  'ss',
]);

const SMALL_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'as',
  'is',
  'are',
  'be',
  'up',
  'if',
  'so',
  'no',
  'not',
  'vs',
  'via',
  'per',
]);

/** @type {Map<string, Array<{row:number, en:string, zh_tw:string, zh_cn:string}>>} */
const excelByZhCn = new Map();

function loadExcel() {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const XLSX = require('xlsx');
  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  for (let i = 1; i < rows.length; i++) {
    const [, en, zhTw, zhCn] = rows[i];
    const zhcn = String(zhCn ?? '').trim();
    if (!zhcn) continue;
    const rec = {
      row: i + 1,
      en: String(en ?? '').trim(),
      zh_tw: String(zhTw ?? '').trim(),
      zh_cn: zhcn,
    };
    if (!excelByZhCn.has(zhcn)) excelByZhCn.set(zhcn, []);
    excelByZhCn.get(zhcn).push(rec);
  }
}

function parseCatalog(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  /** @type {Array<{section:string, key:string, value:string}>} */
  const entries = [];
  const sectionsOrder = [];
  let section = 'General';
  let currentKey = null;
  let buf = [];

  for (const line of text.split('\n')) {
    const sec = line.match(/^\s*\/\/\s*(.+)$/);
    if (sec && !line.includes('/**')) {
      section = sec[1].trim();
      if (!sectionsOrder.includes(section)) sectionsOrder.push(section);
      continue;
    }
    const single = line.match(
      /^\s*(?:'((?:\\'|[^'])*)'|"((?:\\"[^"]*)")|([A-Za-z][A-Za-z0-9]*))\s*:\s*'((?:\\'|[^'])*)'\s*,?\s*(?:\/\/.*)?$/,
    );
    if (single) {
      const key = single[1] ?? single[2]?.slice(1, -1) ?? single[3];
      const val = single[4].replace(/\\'/g, "'");
      entries.push({ section, key, value: val });
      currentKey = null;
      buf = [];
      continue;
    }
    const multiStart = line.match(
      /^\s*(?:'((?:\\'|[^'])*)'|"((?:\\"[^"]*)")|([A-Za-z][A-Za-z0-9]*))\s*:\s*$/,
    );
    if (multiStart) {
      currentKey = (multiStart[1] ?? multiStart[2]?.slice(1, -1) ?? multiStart[3]).replace(
        /\\'/g,
        "'",
      );
      buf = [];
      continue;
    }
    if (currentKey) {
      const s = line.trim();
      if (s.endsWith("',") || s.endsWith("'")) {
        let part = s.endsWith(',') ? s.slice(0, -1) : s;
        if (part.startsWith("'") && part.endsWith("'")) {
          buf.push(part.slice(1, -1).replace(/\\'/g, "'"));
        }
        if (s.endsWith("',") || (s.endsWith("'") && !s.endsWith("\\'"))) {
          entries.push({ section, key: currentKey, value: buf.join('\n') });
          currentKey = null;
          buf = [];
        }
      } else if (s.startsWith("'")) {
        buf.push(s.replace(/^'|'\+?$/g, '').replace(/\\'/g, "'"));
      }
    }
  }
  return { entries, sectionsOrder };
}

function scoreMatch(oldEn, candidate) {
  const en = candidate.en;
  if (!en || en.length < 2) return -1;
  if (en === oldEn) return 100;
  if (en.toLowerCase() === oldEn.toLowerCase()) return 95;
  const o = oldEn.toLowerCase();
  const e = en.toLowerCase();
  if (o === e) return 95;
  if (o.includes(e) || e.includes(o)) return 75;
  const ot = new Set(o.split(/[^a-z0-9]+/).filter(Boolean));
  const et = new Set(e.split(/[^a-z0-9]+/).filter(Boolean));
  const overlap = [...ot].filter((t) => et.has(t)).length;
  if (overlap >= 2) return 40 + overlap;
  if (overlap === 1) return 25;
  return 0;
}

function pickMatch(section, oldEn, zhCn) {
  const matches = excelByZhCn.get(zhCn);
  if (!matches?.length) return null;
  return [...matches].sort((a, b) => scoreMatch(oldEn, b) - scoreMatch(oldEn, a))[0];
}

function isParagraph(zhCn, enText, section) {
  if (/[。！？；]$/.test(zhCn)) return true;
  if (zhCn.length > 40 && /[，。！？]/.test(zhCn)) return true;
  if (/[?？]$/.test(zhCn) && zhCn.length > 18) return true;
  if ((enText.match(/\.\s+[A-Z]/g) ?? []).length >= 1 && enText.length > 55) return true;
  if (section === 'Batch signing' && zhCn.length > 28) {
    if (/是否|请|停止后|退出后|建议|超出|需要支付/.test(zhCn)) return true;
  }
  if (/^(请|您|该|停止后|退出后|团队提币)/.test(zhCn)) return true;
  return false;
}

function capitalizeToken(token, isFirst) {
  if (!token) return token;
  if (/^\{[^}]+\}$/.test(token) || /^\$\{[^}]+\}$/.test(token)) return token;
  if (/^≤|^≈|^≥/.test(token)) return token;
  if (/^\d/.test(token)) return token;
  const lower = token.toLowerCase();
  const bare = lower.replace(/[^a-z0-9]/g, '');
  if (ACRONYMS.has(bare)) return token.replace(/[a-z]+/gi, (m) => m.toUpperCase());
  if (PROPER_NOUNS.has(bare)) {
    return token.charAt(0).toUpperCase() + token.slice(1);
  }
  if (!isFirst && SMALL_WORDS.has(lower)) return lower;
  if (token.includes('-')) {
    return token
      .split('-')
      .map((p, i) => capitalizeToken(p, isFirst && i === 0))
      .join('-');
  }
  if (token.includes('/')) {
    return token
      .split('/')
      .map((p, i) => capitalizeToken(p.trim(), isFirst && i === 0))
      .join(' / ');
  }
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function splitTokens(text) {
  return text.split(/(\s+|\{[^}]+\}|\$\{[^}]+\}|≤[^ ]+|≈[^ ]+|[$][\d.]+|[A-Z]{2,}|[\w'/-]+)/).filter(Boolean);
}

function toTitleCase(en) {
  const raw = en.trim();
  if (!raw) return raw;
  const parts = raw.split(/(\s+)/);
  let wordIndex = 0;
  return parts
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      const out = capitalizeToken(part, wordIndex === 0);
      wordIndex += 1;
      return out;
    })
    .join('');
}

function toSentenceCase(en) {
  const raw = en.trim();
  if (!raw) return raw;
  const sentences = raw.split(/(?<=[.!?])\s+/);
  return sentences
    .map((sentence, si) => {
      const parts = sentence.split(/(\s+)/);
      let wordIndex = 0;
      return parts
        .map((part) => {
          if (/^\s+$/.test(part)) return part;
          if (wordIndex === 0 && si === 0) {
            wordIndex++;
            return capitalizeToken(part, true);
          }
          wordIndex++;
          const lower = part.toLowerCase();
          const bare = lower.replace(/[^a-z0-9]/g, '');
          if (ACRONYMS.has(bare) || PROPER_NOUNS.has(bare)) {
            return capitalizeToken(part, true);
          }
          if (/^\{[^}]+\}$/.test(part) || /^\$\{[^}]+\}$/.test(part)) return part;
          if (/^≤|^≈|^≥/.test(part) || /^\d/.test(part)) return part;
          return part.toLowerCase();
        })
        .join('');
    })
    .join(' ');
}

function formatEnglish(en, zhCn, section) {
  const cleaned = en.trim();
  if (!cleaned) return cleaned;
  if (/^[\d≤≈$]/.test(cleaned) || /^[A-Z0-9 /~.+-]+$/.test(cleaned) && !/[a-z]{4,}/.test(cleaned)) {
    return cleaned;
  }
  if (isParagraph(zhCn, cleaned, section)) return toSentenceCase(cleaned);
  return toTitleCase(cleaned);
}

function tsKey(k) {
  if (/^[A-Za-z][A-Za-z0-9]*$/.test(k)) return k;
  return `'${k.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function emitEntry(key, val) {
  const escaped = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  if (!val.includes('\n')) return [`  ${tsKey(key)}: '${escaped}',`];
  const parts = escaped.split('\n');
  const lines = [`  ${tsKey(key)}:`];
  lines.push(`    '${parts[0]}' +`);
  for (const part of parts.slice(1, -1)) lines.push(`    '${part}\\n' +`);
  lines.push(`    '${parts.at(-1)}',`);
  return lines;
}

function main() {
  loadExcel();
  const { entries, sectionsOrder } = parseCatalog(catalogPath);

  /** @type {Map<string, string>} */
  const catalog = new Map();
  /** @type {Map<string, string>} */
  const catalogTw = new Map();
  /** @type {Map<string, string>} */
  const keySection = new Map();
  /** @type {Array<[string,string]>} */
  const renames = [];
  /** @type {Array<object>} */
  const unaligned = [];
  /** @type {Array<object>} */
  const aligned = [];

  for (const { section, key: oldEn, value: zhCn } of entries) {
    const match = pickMatch(section, oldEn, zhCn);
    let finalEn = oldEn;
    let docEn = '';
    let docTw = '';
    let status = 'unchanged';

    if (match) {
      docEn = match.en;
      docTw = match.zh_tw;
    }

    if (NAV_MENU_SECTIONS.has(section)) {
      finalEn = oldEn;
      if (docTw) catalogTw.set(finalEn, docTw);
      if (!match) {
        unaligned.push({ section, zh_cn: zhCn, old_en: oldEn, reason: '文档无 zh-cn 匹配' });
      } else {
        aligned.push({ section, zh_cn: zhCn, en: finalEn, zh_tw: docTw || '' });
      }
    } else if (!match || !docEn) {
      unaligned.push({
        section,
        zh_cn: zhCn,
        old_en: oldEn,
        reason: '文档无 zh-cn 匹配',
      });
    } else {
      const formattedEn = formatEnglish(docEn, zhCn, section);
      if (formattedEn !== oldEn) {
        if (!catalog.has(formattedEn) || catalog.get(formattedEn) === zhCn) {
          finalEn = formattedEn;
          if (oldEn !== finalEn) renames.push([oldEn, finalEn]);
          status = 'renamed';
        }
      }
      if (catalog.has(finalEn) && catalog.get(finalEn) !== zhCn) {
        finalEn = oldEn;
        status = 'key_conflict_kept_old_en';
      }
      catalog.set(finalEn, zhCn);
      keySection.set(finalEn, section);
      if (docTw) catalogTw.set(finalEn, docTw);
      aligned.push({
        section,
        zh_cn: zhCn,
        en: finalEn,
        zh_tw: docTw || '',
        doc_en_raw: docEn,
        status,
      });
      continue;
    }

    if (!catalog.has(finalEn)) {
      catalog.set(finalEn, zhCn);
      keySection.set(finalEn, section);
    }
  }

  // Preserve order from original entries
  const outputOrder = [];
  const seen = new Set();
  for (const { section, key: oldEn, value: zhCn } of entries) {
    let en = oldEn;
    const hit = renames.find(([o]) => o === oldEn);
    if (hit) en = hit[1];
    if (catalog.has(en) && catalog.get(en) === zhCn && !seen.has(en)) {
      seen.add(en);
      outputOrder.push({ section, en });
    } else if (!seen.has(oldEn) && catalog.has(oldEn)) {
      seen.add(oldEn);
      outputOrder.push({ section, en: oldEn });
    }
  }
  for (const [en] of catalog) {
    if (!seen.has(en)) outputOrder.push({ section: keySection.get(en) ?? 'General', en });
  }

  const cnLines = [
    '/** English UI source text → 简体中文（仅展示层；路由 / 状态仍用英文 key）。 */',
    'export const UI_TEXT_ZH_CN: Record<string, string> = {',
  ];
  let lastSection = '';
  for (const { section, en } of outputOrder) {
    if (section !== lastSection) {
      if (lastSection) cnLines.push('');
      cnLines.push(`  // ${section}`);
      lastSection = section;
    }
    cnLines.push(...emitEntry(en, catalog.get(en) ?? ''));
  }
  cnLines.push('', '};', '');

  const twLines = [
    '/** English UI source text → 繁體中文（源文檔 zh-cn 匹配；Nav/模块菜单仅 zh-tw）。 */',
    'export const UI_TEXT_ZH_TW: Record<string, string> = {',
  ];
  lastSection = '';
  for (const { section, en } of outputOrder) {
    if (!catalogTw.has(en)) continue;
    if (section !== lastSection) {
      if (lastSection) twLines.push('');
      twLines.push(`  // ${section}`);
      lastSection = section;
    }
    twLines.push(...emitEntry(en, catalogTw.get(en) ?? ''));
  }
  twLines.push('', '};', '');

  fs.writeFileSync(twOut, cnLines.join('\n'));
  fs.writeFileSync(twPath, twLines.join('\n'));
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        stats: {
          catalog: catalog.size,
          zh_tw: catalogTw.size,
          renames: renames.length,
          unaligned: unaligned.length,
          aligned: aligned.length,
        },
        renames: renames.map(([from, to]) => ({ from, to })),
        unaligned,
      },
      null,
      2,
    ),
  );

  console.log(JSON.stringify({ catalog: catalog.size, tw: catalogTw.size, renames: renames.length, unaligned: unaligned.length }));
}

main();
