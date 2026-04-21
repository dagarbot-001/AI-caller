import type { AgentMode } from '../modes/types';
import { buildAgentPrompt } from '../prompts/builder';
import { GeminiService, type GeminiMessage } from '../ai/GeminiService';
import { VoiceService } from '../voice/VoiceService';

type AgentConfig = {
  mode: AgentMode;
  customerName: string;
  startLine: string;
  geminiApiKey: string;
  onTranscript: (speaker: 'user' | 'aisha', text: string) => void;
  onStateChange: (state: 'idle' | 'speaking' | 'listening' | 'thinking' | 'error') => void;
  onError: (error: string) => void;
};

export class AgentController {
  private voice = new VoiceService('hi-IN');
  private gemini: GeminiService;
  private history: GeminiMessage[] = [];
  private running = false;
  private busy = false;

  constructor(private config: AgentConfig) {
    const prompt = buildAgentPrompt({
      mode: config.mode,
      customerName: config.customerName,
      startLine: config.startLine,
    });

    this.gemini = new GeminiService(config.geminiApiKey, prompt);
  }

  isSupported(): boolean {
    return this.voice.isSupported();
  }

  async start(): Promise<void> {
    if (this.running) return;

    this.running = true;
    this.config.onStateChange('speaking');

    await this.sayAndTrack(this.config.startLine);
    this.listenLoop();
  }

  stop(): void {
    this.running = false;
    this.busy = false;
    this.voice.stopListening();
    this.config.onStateChange('idle');
  }

  private listenLoop(): void {
    if (!this.running) return;

    this.config.onStateChange('listening');
    this.voice.startListening({
      onFinalText: async (text) => {
        if (this.busy || !this.running) return;

        this.busy = true;
        this.voice.stopListening();
        this.config.onTranscript('user', text);

        try {
          this.config.onStateChange('thinking');
          const reply = await this.gemini.generateReply(this.history, text);

          this.history.push({ role: 'user', text });
          this.history.push({ role: 'model', text: reply });

          await this.sayAndTrack(reply);
        } catch (error) {
          this.config.onStateChange('error');
          this.config.onError(error instanceof Error ? error.message : 'Unknown agent error');
        } finally {
          this.busy = false;
          if (this.running) {
            this.listenLoop();
          }
        }
      },
      onError: (error) => {
        this.config.onStateChange('error');
        this.config.onError(error);
      },
    });
  }

  private async sayAndTrack(text: string): Promise<void> {
    this.config.onTranscript('aisha', text);
    this.config.onStateChange('speaking');
    await this.voice.speak(text);
  }
}
