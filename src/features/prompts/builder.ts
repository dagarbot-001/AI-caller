import { SALES_MODE_PROMPT } from '../modes/sales.mode';
import { RECOVERY_MODE_PROMPT } from '../modes/recovery.mode';
import type { AgentMode } from '../modes/types';
import { BASE_AGENT_PROMPT } from './base.prompt';

export type PromptBuildInput = {
  mode: AgentMode;
  customerName: string;
  startLine: string;
};

export const buildAgentPrompt = ({ mode, customerName, startLine }: PromptBuildInput): string => {
  const modePrompt = mode === 'SALES' ? SALES_MODE_PROMPT : RECOVERY_MODE_PROMPT;

  return `${BASE_AGENT_PROMPT}

${modePrompt}

Customer name: ${customerName}
Call opening line (must be used by Aisha at call start): ${startLine}

Conversation constraints:
- Start by saying the opening line naturally.
- Verify this is ${customerName} before deep conversation.
- If identity not confirmed, ask for correct person politely.
- Stay in selected mode strictly.
- Output plain conversational text only.`;
};
