import { getProcessedIcon } from '@eds/desktop-components';
import { formatGroupedAmountText, formatGroupedTemplateValue } from '@/utils/formatGroupedDisplay';

const TRON_RESOURCES_ICON_DESIGN = 'eds-energy-fill';
const TRON_RESOURCES_ICON_FALLBACK = 'eds-gas-fee';

/** 设计稿为 eds-energy-fill；引用库暂无该 SVG 时回退 eds-gas-fee。 */
export function resolveTronResourcesIconName(): string {
  return getProcessedIcon(TRON_RESOURCES_ICON_DESIGN)
    ? TRON_RESOURCES_ICON_DESIGN
    : TRON_RESOURCES_ICON_FALLBACK;
}

export type TronMinerFeeQuote = {
  bandwidth: number;
  energy: number;
  activationExtraTrx: number;
  estimatedTrx: string;
  estimatedUsd: string;
};

/** TRON 演示用固定资源与能量模式报价。 */
export function resolveTronMinerFeeQuote(): TronMinerFeeQuote {
  return {
    bandwidth: 345,
    energy: 885,
    activationExtraTrx: 1,
    estimatedTrx: '6.75',
    estimatedUsd: '$4.88',
  };
}

export function fillMinerFeeUiTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, formatGroupedTemplateValue(value)),
    template,
  );
}

export function buildTronMinerFeeDisplay(quote?: TronMinerFeeQuote): string {
  const resolved = quote ?? resolveTronMinerFeeQuote();
  return formatGroupedAmountText(`${resolved.estimatedTrx} TRX ≈ ${resolved.estimatedUsd}`);
}
