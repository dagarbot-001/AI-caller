import { useMemo, useRef, useState } from 'react';
import type { AgentMode } from '../features/modes/types';
import { AgentController } from '../features/agent/AgentController';

type TranscriptItem = {
  speaker: 'user' | 'aisha';
  text: string;
};

export const useAgent = (config: { customerName: string; startLine: string }) => {
  const [mode, setMode] = useState<AgentMode>('SALES');
  const [state, setState] = useState<'idle' | 'speaking' | 'listening' | 'thinking' | 'error'>('idle');
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const controllerRef = useRef<AgentController | null>(null);

  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  const statusLabel = useMemo(() => {
    if (state === 'idle') return 'Idle';
    if (state === 'speaking') return 'Aisha बोल रही है...';
    if (state === 'listening') return 'Aisha सुन रही है...';
    if (state === 'thinking') return 'Aisha सोच रही है...';
    return 'Error';
  }, [state]);

  const start = async () => {
    setError(null);

    controllerRef.current?.stop();

    const controller = new AgentController({
      mode,
      customerName: config.customerName,
      startLine: config.startLine,
      geminiApiKey: geminiKey ?? '',
      onTranscript: (speaker, text) => setTranscript((prev) => [...prev, { speaker, text }]),
      onStateChange: setState,
      onError: setError,
    });

    if (!controller.isSupported()) {
      setError('Browser does not support Web Speech APIs. Use latest Chrome/Edge.');
      setState('error');
      return;
    }

    controllerRef.current = controller;
    await controller.start();
  };

  const stop = () => {
    controllerRef.current?.stop();
  };

  const switchMode = () => {
    stop();
    setTranscript([]);
    setMode((prev) => (prev === 'SALES' ? 'RECOVERY' : 'SALES'));
    setState('idle');
  };

  return { mode, state, statusLabel, transcript, error, start, stop, switchMode };
};
