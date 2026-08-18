/**
 * en 展示层格式：词组 Title Case、段落 Sentence case。
 * 源文档 / I18N_DOC_EN_LABELS 已有译文一律原样返回（含 MPC、TxID 等专业词）。
 */

/** 常见缩写 / 专业词 — 不做大小写改写 */
const ENGLISH_PRESERVE_TOKENS = new Set([
  'API',
  'AML',
  'APAC',
  'BTC',
  'BSC',
  'ETH',
  'IP',
  'MPC',
  'QR',
  'TxID',
  'URL',
  'USDT',
  'USD',
  'UTC',
  'ID',
]);

function isPreservedEnglishToken(token: string): boolean {
  const trimmed = token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
  if (!trimmed) return false;
  if (ENGLISH_PRESERVE_TOKENS.has(trimmed)) return true;
  if (/^[A-Z0-9]{2,}$/.test(trimmed)) return true;
  if (/^v\d/i.test(trimmed)) return true;
  return false;
}

function capitalizeWord(word: string): string {
  if (!word) return word;
  const coreMatch = word.match(/[A-Za-z0-9]+/);
  if (coreMatch && isPreservedEnglishToken(coreMatch[0])) return word;
  const match = word.match(/^([^A-Za-z0-9]*)([A-Za-z0-9]+)(.*)$/);
  if (!match) return word;
  const [, lead, core, tail] = match;
  if (isPreservedEnglishToken(core)) return word;
  return `${lead}${core.charAt(0).toUpperCase()}${core.slice(1).toLowerCase()}${tail}`;
}

/** 词组 / 标签 / 按钮：各词首字母大写（专业词除外）。 */
export function formatEnglishPhrase(text: string): string {
  return text
    .split(/(\s+)/)
    .map((part) => (/\s+/.test(part) ? part : capitalizeWord(part)))
    .join('');
}

/** 段落 / 长说明：仅句首大写，其余小写（保留 ${}、数字、专业词）。 */
export function formatEnglishParagraph(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const sentences = trimmed.split(/(?<=[.!?])\s+/);
  return sentences
    .map((sentence, index) => {
      const body = index === 0 ? sentence : sentence.toLowerCase();
      const firstAlpha = body.search(/[A-Za-z]/);
      if (firstAlpha < 0) return body;
      return (
        body.slice(0, firstAlpha)
        + body.charAt(firstAlpha).toUpperCase()
        + body.slice(firstAlpha + 1)
      );
    })
    .join(' ');
}

/** 依据 catalog 简体中文判断是否为段落型文案。 */
export function isParagraphCatalogValue(zhCn: string, englishSource: string): boolean {
  if (zhCn.includes('\n')) return true;
  if (/[。！？；]\s*[\u3400-\u9fff]/.test(zhCn)) return true;
  if (zhCn.length >= 48) return true;
  if (englishSource.length >= 120) return true;
  if (/[.!?]\s+[A-Za-z]/.test(englishSource)) return true;
  return false;
}

export function formatEnglishUiText(
  englishSource: string,
  zhCnBaseline: string,
  docEnglish?: string,
): string {
  if (docEnglish) return docEnglish;
  if (isParagraphCatalogValue(zhCnBaseline, englishSource)) {
    return formatEnglishParagraph(englishSource);
  }
  return formatEnglishPhrase(englishSource);
}
