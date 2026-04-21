# Aisha Real-Time Voice AI Agent

Production-style voice AI agent built with **React + Vite + TypeScript**, Web Speech APIs, and Google Gemini.

## Features

- Real-time voice loop (listen → think → speak → listen)
- Female persona "Aisha" with Hinglish tone
- Two instant-switch modes:
  - `SALES`
  - `RECOVERY`
- Prompt architecture with mode-specific behavior
- Stateful transcript and live status UI

## Project Structure

```txt
src/
├── App.tsx
├── main.tsx
├── styles.css
├── hooks/
│   └── useAgent.ts
└── features/
    ├── agent/
    │   └── AgentController.ts
    ├── ai/
    │   └── GeminiService.ts
    ├── modes/
    │   ├── sales.mode.ts
    │   ├── recovery.mode.ts
    │   └── types.ts
    ├── prompts/
    │   ├── base.prompt.ts
    │   └── builder.ts
    └── voice/
        └── VoiceService.ts
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

Set:

```env
VITE_GEMINI_API_KEY=your_google_gemini_api_key
```

3. Run UI:

```bash
npm run client:dev
```

## Browser Support

Use latest Chrome/Edge for full Web Speech API support.
