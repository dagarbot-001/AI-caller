type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = Event & {
  error: string;
};

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    SpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export class VoiceService {
  private recognition: SpeechRecognitionLike | null = null;
  private active = false;

  constructor(private readonly language = 'hi-IN') {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Recognition) {
      this.recognition = new Recognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = language;
    }
  }

  isSupported(): boolean {
    return !!this.recognition && typeof window.speechSynthesis !== 'undefined';
  }

  async speak(text: string): Promise<void> {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.language;
    utterance.pitch = 1.15;
    utterance.rate = 0.95;

    const preferredVoice = this.pickVoice(this.language);
    if (preferredVoice) utterance.voice = preferredVoice;

    await new Promise<void>((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error('Failed to synthesize speech.'));
      window.speechSynthesis.speak(utterance);
    });
  }

  startListening(options: { onFinalText: (text: string) => void; onError: (error: string) => void }): void {
    if (!this.recognition) {
      options.onError('Speech recognition is not supported in this browser.');
      return;
    }

    if (this.active) return;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';

      for (let i = event.results.length - 1; i >= 0; i -= 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript = result[0].transcript.trim();
          break;
        }
      }

      if (finalTranscript) {
        options.onFinalText(finalTranscript);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.active = false;
      options.onError(event.error || 'Unknown speech recognition error.');
    };

    this.recognition.onend = () => {
      if (this.active) {
        this.recognition?.start();
      }
    };

    this.active = true;
    this.recognition.start();
  }

  stopListening(): void {
    this.active = false;
    this.recognition?.stop();
  }

  private pickVoice(lang: string): SpeechSynthesisVoice | undefined {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((voice) => voice.lang.startsWith(lang)) ?? voices.find((voice) => /female|woman/i.test(voice.name));
  }
}
