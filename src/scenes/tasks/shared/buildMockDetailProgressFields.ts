import {
  buildDetailProgressFields,
  type DetailProgressScenario,
} from './buildDetailProgressFields';

export function buildMockDetailProgressFields(
  rowIndex: number,
  options: {
    initiatorNote: string;
    scenario?: DetailProgressScenario;
    menuItem?: string;
  },
) {
  return buildDetailProgressFields(rowIndex, {
    initiatorNote: options.initiatorNote,
    scenario: options.scenario ?? 'approval-workflow',
    menuItem: options.menuItem,
  });
}

export type { DetailProgressScenario } from './buildDetailProgressFields';
