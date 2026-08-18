#!/usr/bin/env python3
"""
Align uiTextZhTW from product Excel (zh-cn baseline).
- NEVER modifies uiTextZhCN.ts values or keys.
- Looks up each catalog zh-cn in Excel → fills zh-tw under the existing English key.
- Writes i18n-alignment-report.json with doc en-us suggestions + gaps.
- Unaligned keys: runtime shows catalog zh-cn in all locales (en / zh-TW / zh-CN).
- Field values / person names are NOT i18n keys — do not pass to ui() (see work.mdc §5).
- Doc en-us overrides → i18nDocEnLabels.ts (English capitalization per work.mdc §5).
"""

from __future__ import annotations

import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
XLSX = Path(
    sys.argv[1]
    if len(sys.argv) > 1
    else '/Users/DanBaby/Downloads/產品多语言文檔_源文檔-不要動 🔒.xlsx'
)
CATALOG = ROOT / 'src/i18n/uiTextZhCN.ts'
TW_OUT = ROOT / 'src/i18n/uiTextZhTW.ts'
OVERRIDES_TS = ROOT / 'src/i18n/collaborationLocaleOverrides.ts'
REPORT = ROOT / 'src/i18n/i18n-alignment-report.json'
ALIGNED_KEYS_OUT = ROOT / 'src/i18n/i18nDocAlignedKeys.ts'
DOC_EN_LABELS_OUT = ROOT / 'src/i18n/i18nDocEnLabels.ts'
CATALOG_MISSING_OUT = ROOT / 'src/i18n/i18nCatalogMissingFromCode.ts'

UI_CALL_PATTERN = re.compile(r"""ui\(\s*(['"])([^'"]+)\1""")

NAV_MENU_SECTIONS = {
    'Nav & module titles',
    'Tasks module menu',
    'Account settings menu',
    'Payment Engine menu',
    'Notifications menu',
    'Manage menu',
    'WaaS menu',
}

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

MANUAL_EN_BY_ZH_CN = {
    '接收方': 'Receiver',
    '发送方': 'Sender',
    '申请时间': 'Created Time',
    '条': 'Items',
    '共': 'Total',
    '提币': 'Payout',
    '出款': 'Withdrawal',
    '请输入': 'Please Enter',
    '签名': 'Sign',
    '待签名': 'Pending Signature',
    '签名通过': 'Signed',
    '发起': 'Submitted Request',
    '申请': 'Apply',
    '申请付款': 'Initiate send request',
    '通过': 'Pass',
    '审批进度': 'Status',
    '设备类型': 'Equipment Type',
    '触发策略': 'Trigger Policy',
    '三方业务编号': 'Third Party Business Number',
    '较慢': 'Slow',
    '正常': 'Normal',
    '快速': 'Fast',
    '本次交易所需资源': 'Resources required for this transaction',
    '操作成功': 'Operation succeeded',
    '发起方': 'Initiator',
    '出款钱包': 'Payout Wallets',
    '矿工费': 'Gas Fee',
    '待审批': 'Pending Approval',
    '审批': 'Approval',
}

# catalog zh-cn → 文档/核对表 zh-cn（仅用于查找，不改 catalog 值）
ZH_CN_LOOKUP_ALIASES = {
    '选填，最多 256 字符': '选填，256字符以内。',
    '已选择': '已选中',
    '发起源': '发起入口',
}


def resolve_zh_cn_for_lookup(zh_cn: str) -> list[str]:
    keys = [zh_cn]
    alias = ZH_CN_LOOKUP_ALIASES.get(zh_cn)
    if alias:
        keys.append(alias)
    return keys


def col_row(ref: str):
    m = re.match(r'([A-Z]+)(\d+)', ref)
    col = m.group(1)
    n = sum((ord(ch) - 64) * 26 ** i for i, ch in enumerate(reversed(col)))
    return n


def load_shared_strings(z: zipfile.ZipFile) -> list[str]:
    root = ET.fromstring(z.read('xl/sharedStrings.xml'))
    out: list[str] = []
    for si in root.findall('m:si', NS):
        parts = [
            t.text or ''
            for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
        ]
        out.append(''.join(parts))
    return out


def cell_text(c, sst: list[str]) -> str:
    v = c.find('m:v', NS)
    if v is None or v.text is None:
        return ''
    if c.get('t') == 's':
        idx = int(v.text)
        return sst[idx] if 0 <= idx < len(sst) else ''
    return v.text


def load_excel() -> dict[str, list[dict]]:
    excel_by_zhcn: dict[str, list[dict]] = defaultdict(list)
    with zipfile.ZipFile(XLSX) as z:
        sst = load_shared_strings(z)
        sheet = 'xl/worksheets/sheet1.xml'
        if sheet not in z.namelist():
            sheet = sorted(n for n in z.namelist() if n.startswith('xl/worksheets/sheet'))[0]
        root = ET.fromstring(z.read(sheet))
    for row_el in root.findall('.//m:sheetData/m:row', NS):
        rnum = int(row_el.get('r'))
        if rnum == 1:
            continue
        row = {}
        for c in row_el.findall('m:c', NS):
            row[col_row(c.get('r'))] = cell_text(c, sst).strip()
        rec = {
            'row': rnum,
            'en': row.get(1, '').strip(),
            'zh_tw': row.get(2, '').strip(),
            'zh_cn': row.get(3, '').strip(),
        }
        if rec['zh_cn']:
            excel_by_zhcn[rec['zh_cn']].append(rec)
    return excel_by_zhcn


def load_collaboration_overrides() -> dict[str, tuple[str, str, str]]:
    """en → (zh_cn, zh_tw)"""
    text = OVERRIDES_TS.read_text(encoding='utf-8')
    by_en: dict[str, tuple[str, str, str]] = {}
    pattern = re.compile(
        r"(?:'((?:\\'|[^'])*)'|([A-Za-z][A-Za-z0-9]*))\s*:\s*\[\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'\s*\]"
    )
    for m in pattern.finditer(text):
        en = (m.group(1) or m.group(2)).replace("\\'", "'")
        zh_cn = m.group(3).replace("\\'", "'")
        zh_tw = m.group(4).replace("\\'", "'")
        by_en[en] = (zh_cn, zh_tw, en)
    return by_en


def load_overrides_by_zhcn() -> dict[str, tuple[str, str]]:
    by_en = load_collaboration_overrides()
    out: dict[str, tuple[str, str]] = {}
    for en, (zh_cn, zh_tw, _) in by_en.items():
        out[zh_cn] = (en, zh_tw)
    return out


def catalog_key_set(entries: list[tuple[str, str, str]]) -> set[str]:
    return {en_key for _, en_key, _ in entries}


def catalog_near_match(en_key: str, catalog_keys: set[str]) -> str | None:
    lower = en_key.lower()
    for candidate in catalog_keys:
        if candidate.lower() == lower:
            return candidate
    return None


def scan_catalog_missing_from_code(catalog_keys: set[str]) -> list[dict]:
    """ui() keys used in src but absent from uiTextZhCN (deduped by key)."""
    refs: dict[str, set[str]] = defaultdict(set)
    src_root = ROOT / 'src'
    skip_parts = {'uiTextZhCN.ts', 'i18nCatalogMissingFromCode.ts'}
    for path in sorted(src_root.rglob('*')):
        if path.suffix not in {'.vue', '.ts'}:
            continue
        if any(part in skip_parts for part in path.parts):
            continue
        text = path.read_text(encoding='utf-8')
        rel = str(path.relative_to(ROOT))
        for m in UI_CALL_PATTERN.finditer(text):
            key = m.group(2)
            if key not in catalog_keys:
                refs[key].add(rel)
    missing: list[dict] = []
    for en_key in sorted(refs.keys(), key=str.lower):
        near = catalog_near_match(en_key, catalog_keys)
        item: dict = {
            'en_key': en_key,
            'ref_count': len(refs[en_key]),
            'refs': sorted(refs[en_key]),
            'status': 'deferred',
        }
        if near and near != en_key:
            item['catalog_near_match'] = near
        missing.append(item)
    return missing


def write_catalog_missing_ts(missing: list[dict]) -> None:
    near_map = {
        item['en_key']: item['catalog_near_match']
        for item in missing
        if item.get('catalog_near_match')
    }
    lines = [
        '/**',
        ' * Backlog：代码 `ui(\'…\')` 引用但 uiTextZhCN.ts 尚无条目（按 key 去重，不按出现次数）。',
        ' * 状态：暂不处理 — 待补 catalog 或改代码对齐已有 key。',
        ' * 由 scripts/sync-i18n-from-excel.py 扫描生成。',
        ' */',
        "export const I18N_CATALOG_MISSING_STATUS = 'deferred' as const;",
        '',
        '/** en key → catalog 中近似条目（大小写/用词不同）；修复时优先改引用。 */',
        'export const I18N_CATALOG_MISSING_NEAR_MATCH: Readonly<Record<string, string>> = {',
    ]
    for key in sorted(near_map.keys(), key=str.lower):
        near = near_map[key]
        escaped_key = key.replace('\\', '\\\\').replace("'", "\\'")
        escaped_near = near.replace('\\', '\\\\').replace("'", "\\'")
        lines.append(f"  '{escaped_key}': '{escaped_near}',")
    lines.extend(['};', '', 'export const I18N_CATALOG_MISSING_FROM_CODE = ['])
    for item in missing:
        escaped = item['en_key'].replace('\\', '\\\\').replace("'", "\\'")
        lines.append(f"  '{escaped}',")
    lines.extend(['] as const;', ''])
    CATALOG_MISSING_OUT.write_text('\n'.join(lines), encoding='utf-8')


def parse_catalog(path: Path):
    text = path.read_text(encoding='utf-8')
    entries: list[tuple[str, str, str]] = []
    sections_order: list[str] = []
    section = 'General'
    pattern = re.compile(
        r"^\s*(?:'((?:\\'|[^'])*)'|\"((?:\\\"|[^\"])*)\"|([A-Za-z][A-Za-z0-9]*))\s*:\s*'((?:\\'|[^'])*)'\s*,?\s*(?://.*)?$"
    )
    pattern2 = re.compile(
        r"^\s*(?:'((?:\\'|[^'])*)'|\"((?:\\\"|[^\"])*)\"|([A-Za-z][A-Za-z0-9]*))\s*:\s*$"
    )
    current_key = None
    for line in text.splitlines():
        cm = re.match(r'\s*//\s*(.+)', line)
        if cm and not line.strip().startswith('/**'):
            section = cm.group(1).strip()
            if section not in sections_order:
                sections_order.append(section)
            continue
        m = pattern.match(line)
        if m:
            key = m.group(1) or m.group(2) or m.group(3)
            val = m.group(4).replace("\\'", "'")
            entries.append((section, key, val))
            current_key = None
            continue
        m2 = pattern2.match(line)
        if m2:
            current_key = (m2.group(1) or m2.group(2) or m2.group(3)).replace("\\'", "'")
            continue
        if current_key is not None:
            s = line.strip()
            if s.endswith("',") or s.endswith("'"):
                val_part = s[:-1] if s.endswith(',') else s
                if val_part.startswith("'") and val_part.endswith("'"):
                    entries.append((section, current_key, val_part[1:-1].replace("\\'", "'")))
                    current_key = None
    return entries, sections_order


def score_match(catalog_en: str, candidate: dict) -> int:
    en = candidate['en']
    if not en:
        return -1
    if en == catalog_en:
        return 100
    if en.lower() == catalog_en.lower():
        return 95
    o, e = catalog_en.lower(), en.lower()
    if min(len(o), len(e)) >= 4 and (o in e or e in o):
        return 40
    ot = set(re.findall(r'[a-z0-9]+', o))
    et = set(re.findall(r'[a-z0-9]+', e))
    overlap = len(ot & et)
    if overlap >= 2:
        return 30 + overlap
    return overlap


def pick_excel_match(catalog_en: str, zh_cn: str, excel_by_zhcn: dict):
    matches = []
    for key in resolve_zh_cn_for_lookup(zh_cn):
        matches.extend(excel_by_zhcn.get(key, []))
    if not matches:
        return None
    manual = MANUAL_EN_BY_ZH_CN.get(zh_cn) or MANUAL_EN_BY_ZH_CN.get(
        ZH_CN_LOOKUP_ALIASES.get(zh_cn, '')
    )
    if manual:
        for m in matches:
            if m['en'].lower() == manual.lower():
                return m
        return {'row': 0, 'en': manual, 'zh_tw': matches[0].get('zh_tw', ''), 'zh_cn': zh_cn}
    return sorted(matches, key=lambda m: score_match(catalog_en, m), reverse=True)[0]


def ts_key(k: str) -> str:
    if re.match(r'^[A-Za-z][A-Za-z0-9]*$', k):
        return k
    return "'" + k.replace('\\', '\\\\').replace("'", "\\'") + "'"


def emit_entry(key: str, val: str):
    escaped = val.replace('\\', '\\\\').replace("'", "\\'")
    if '\n' not in val:
        return [f'  {ts_key(key)}: \'{escaped}\',']
    parts = escaped.split('\n')
    lines = [f'  {ts_key(key)}:']
    lines.append(f"    '{parts[0]}' +")
    for part in parts[1:-1]:
        lines.append(f"    '{part}\\n' +")
    lines.append(f"    '{parts[-1]}',")
    return lines


def main():
    excel_by_zhcn = load_excel()
    overrides_by_zhcn = load_overrides_by_zhcn()
    entries, sections_order = parse_catalog(CATALOG)
    catalog_keys = catalog_key_set(entries)
    catalog_missing_from_code = scan_catalog_missing_from_code(catalog_keys)
    write_catalog_missing_ts(catalog_missing_from_code)

    catalog_tw: dict[str, str] = {}
    doc_aligned_keys: set[str] = set()
    aligned: list[dict] = []
    en_mismatch: list[dict] = []
    doc_en_by_key: dict[str, str] = {}
    from_override: list[dict] = []
    unaligned: list[dict] = []

    for section, en_key, zh_cn in entries:
        match = pick_excel_match(en_key, zh_cn, excel_by_zhcn)
        override = None
        for key in resolve_zh_cn_for_lookup(zh_cn):
            override = overrides_by_zhcn.get(key)
            if override:
                break
        doc_tw = ''
        doc_en = ''

        if match:
            doc_en = match['en']
            doc_tw = match.get('zh_tw', '')
        elif override:
            doc_en, doc_tw = override
            from_override.append({'en_key': en_key, 'zh_cn': zh_cn, 'doc_en': doc_en, 'zh_tw': doc_tw})
        else:
            unaligned.append({'section': section, 'en_key': en_key, 'zh_cn': zh_cn, 'reason': '文档无 zh-cn 匹配'})
            continue

        doc_aligned_keys.add(en_key)

        if doc_en:
            doc_en_by_key[en_key] = doc_en

        if doc_tw:
            catalog_tw[en_key] = doc_tw
            aligned.append({'section': section, 'en_key': en_key, 'zh_cn': zh_cn, 'zh_tw': doc_tw})

        if doc_en and doc_en != en_key and doc_en.lower() != en_key.lower():
            if section not in NAV_MENU_SECTIONS or section == 'Tasks module menu':
                # Nav/menu: English keys frozen; only report for non-menu or tasks
                if section not in NAV_MENU_SECTIONS:
                    en_mismatch.append({
                        'section': section,
                        'en_key': en_key,
                        'doc_en': doc_en,
                        'zh_cn': zh_cn,
                        'row': match['row'] if match else 0,
                    })

    tw_lines = [
        '/** English UI source text → 繁體中文（以 uiTextZhCN 的 zh-cn 为基准，匹配源文档填 zh-tw）。 */',
        'export const UI_TEXT_ZH_TW: Record<string, string> = {',
    ]
    last_sec = None
    for section, en_key, _zh_cn in entries:
        if en_key not in catalog_tw:
            continue
        if section != last_sec:
            if last_sec is not None:
                tw_lines.append('')
            tw_lines.append(f'  // {section}')
            last_sec = section
        tw_lines.extend(emit_entry(en_key, catalog_tw[en_key]))
    tw_lines.extend(['', '};', ''])
    TW_OUT.write_text('\n'.join(tw_lines), encoding='utf-8')

    aligned_keys_sorted = sorted(doc_aligned_keys)
    aligned_lines = [
        '/** 源文档 / 核对表已匹配的 catalog 英文 key；未在此 Set 内的条目 runtime 全语言显示 uiTextZhCN 简体中文。 */',
        'export const I18N_DOC_ALIGNED_KEYS = new Set<string>([',
    ]
    for key in aligned_keys_sorted:
        escaped = key.replace('\\', '\\\\').replace("'", "\\'")
        aligned_lines.append(f"  '{escaped}',")
    aligned_lines.extend([']);', ''])
    ALIGNED_KEYS_OUT.write_text('\n'.join(aligned_lines), encoding='utf-8')

    doc_en_lines = [
        '/** 表内 catalog key 的 en-us 展示（Excel / 核对表；由 sync-i18n-from-excel.py 生成）。 */',
        'export const I18N_DOC_EN_LABELS: Record<string, string> = {',
    ]
    for key in sorted(doc_en_by_key.keys(), key=str.lower):
        doc_en = doc_en_by_key[key]
        escaped_val = doc_en.replace('\\', '\\\\').replace("'", "\\'")
        key_fmt = ts_key(key)
        doc_en_lines.append(f'  {key_fmt}: \'{escaped_val}\',')
    doc_en_lines.extend(['};', ''])
    DOC_EN_LABELS_OUT.write_text('\n'.join(doc_en_lines), encoding='utf-8')

    REPORT.write_text(
        json.dumps(
            {
                'stats': {
                    'catalog_entries': len(entries),
                    'zh_tw_filled': len(catalog_tw),
                    'doc_aligned': len(doc_aligned_keys),
                    'aligned': len(aligned),
                    'en_mismatch': len(en_mismatch),
                    'from_override': len(from_override),
                    'unaligned': len(unaligned),
                    'catalog_missing_from_code': len(catalog_missing_from_code),
                    'catalog_missing_status': 'deferred',
                },
                'en_mismatch': en_mismatch,
                'from_override': from_override,
                'unaligned': unaligned,
                'catalog_missing_from_code': catalog_missing_from_code,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding='utf-8',
    )

    print(json.dumps({
        'catalog': len(entries),
        'tw': len(catalog_tw),
        'doc_aligned': len(doc_aligned_keys),
        'en_mismatch': len(en_mismatch),
        'unaligned': len(unaligned),
        'from_override': len(from_override),
        'catalog_missing_from_code': len(catalog_missing_from_code),
    }))


if __name__ == '__main__':
    main()
