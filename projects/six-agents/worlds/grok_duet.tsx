// S05 Grok Bot (xAI) 'Bot office' + S06 Claude Duet (Anthropic) 'Duet desk' - world agent C.
// The worlds live in grok_office.tsx and duet_desk.tsx (helpers: grok_duet_kit.tsx).
import {grokOffice} from './grok_office';
import {duetDesk} from './duet_desk';

export const grokDuetWorlds = {
  S05: grokOffice,
  S06: duetDesk,
};
