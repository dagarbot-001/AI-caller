# AI Voice Sales Agent (Open Source)

A production-structured Node.js voice pipeline that receives audio from Asterisk, transcribes with local Whisper, reasons with OpenAI, synthesizes speech with Piper/Coqui, and returns a response audio file.

## Features

- Express API for call-audio processing
- Asterisk-friendly audio upload endpoint
- Local Whisper STT (speech-to-text)
- OpenAI-driven sales conversation and objection handling
- Local Piper-first TTS with Coqui fallback
- Modular services architecture
- `.env`-based configuration

## Folder Structure

```txt
ai-voice-sales-agent/
├── config/
│   └── systemPrompt.js
├── output/                  # Generated response audio and whisper temp outputs
├── routes/
│   └── callRoutes.js
├── services/
│   ├── openaiService.js
│   ├── sttService.js
│   └── ttsService.js
├── uploads/                 # Incoming Asterisk recordings
├── .env.example
├── package.json
├── README.md
└── server.js
```

## Prerequisites

- Node.js 18+
- npm
- Local Asterisk PBX (running)
- FFmpeg (recommended for audio conversion workflows)
- Python 3.10+ (for Whisper and optional Coqui)

## 1) Setup Project

```bash
npm install
cp .env.example .env
```

Edit `.env` and add:

- `OPENAI_API_KEY` (required)
- `PORT` (default `3000`)
- `PIPER_MODEL_PATH` (recommended for Piper)

Run server:

```bash
node server.js
```

Health check:

```bash
curl http://localhost:3000/health
```

## 2) Install Asterisk (Ubuntu/Debian)

> If you already run Asterisk locally, skip.

```bash
sudo apt update
sudo apt install -y asterisk asterisk-dev
sudo systemctl enable asterisk
sudo systemctl start asterisk
sudo asterisk -rvvv
```

Minimal AGI strategy options:

1. Record caller audio in dialplan (`Record()`), then call this API endpoint.
2. Use `CURL()` in dialplan or AGI script to POST the recording to `/api/call/process`.
3. Play generated file returned by `outputAudioUrl`.

### Example dialplan idea (conceptual)

```asterisk
exten => 100,1,Answer()
 same => n,Record(/var/spool/asterisk/recordings/input.wav,3,20)
 same => n,NoOp(Send recording to AI API via AGI or CURL)
 same => n,Playback(custom/ai-response)
 same => n,Hangup()
```

## 3) Install Whisper (Local STT)

Whisper CLI runs locally through Python.

```bash
sudo apt install -y ffmpeg python3 python3-venv python3-pip
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install openai-whisper
```

Validate installation:

```bash
whisper --help
```

If command not found, use:

```bash
python -m whisper --help
```

And update service command path if needed.

## 4) Install Piper (Recommended Local TTS)

Piper is lightweight and fast for telephony scenarios.

1. Install binary from official release or package manager.
2. Download a voice model (`.onnx` + `.json`).
3. Set `PIPER_MODEL_PATH` in `.env` to the `.onnx` file path.

Sanity test:

```bash
echo "hello from piper" | piper --model /path/to/model.onnx --output_file test.wav
```

## 5) Install Coqui TTS (Fallback)

If Piper is unavailable, app attempts Coqui CLI (`tts`).

```bash
source .venv/bin/activate
pip install TTS
tts --list_models | head
```

Optional env variable:

- `COQUI_MODEL_NAME=tts_models/en/ljspeech/tacotron2-DDC`

## API Usage

### POST `/api/call/process`

- Content-Type: `multipart/form-data`
- Field: `audio` (wav/mp3/etc)

Example:

```bash
curl -X POST http://localhost:3000/api/call/process \
  -F "audio=@sample.wav"
```

Example response:

```json
{
  "success": true,
  "transcript": "I am interested but this seems expensive.",
  "replyText": "Totally fair concern...",
  "outputAudioFile": "/workspace/AI-caller/output/abc-reply.wav",
  "outputAudioUrl": "/audio/abc-reply.wav"
}
```

## Production Notes

- Put service behind reverse proxy (Nginx/Caddy) with TLS.
- Restrict API access to trusted Asterisk hosts.
- Rotate and protect logs (avoid storing sensitive call content long-term).
- Monitor latency for STT + LLM + TTS stages.
- For high throughput, move heavy steps to job queues.

## Troubleshooting

- **`OPENAI_API_KEY is not set`**: set key in `.env`.
- **`whisper command not found`**: activate Python venv or use full binary path.
- **Piper fails**: verify `PIPER_MODEL_PATH` exists.
- **Coqui fails**: ensure `tts` CLI is installed and model is downloadable.

## Run

```bash
npm install
node server.js
```

## Build Downloadable ZIP (without committing binaries)

```bash
npm run zip
```

This generates `ai-voice-sales-agent.zip` in the project root for sharing/deployment.

