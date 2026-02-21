const { spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

/**
 * Convert text to speech with Piper (preferred) or Coqui TTS fallback.
 * @param {string} text - Agent response text.
 * @param {string} outputFileName - Output wave filename.
 * @returns {Promise<string>} Full output file path.
 */
async function synthesizeSpeech(text, outputFileName) {
  if (!text || !text.trim()) {
    throw new Error('Cannot synthesize empty text.');
  }

  const outputDir = path.join(__dirname, '..', 'output');
  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, outputFileName);

  // Prefer Piper for lightweight local TTS. Fallback to Coqui CLI if unavailable.
  try {
    await runPiper(text, outputPath);
    return outputPath;
  } catch (piperError) {
    await runCoqui(text, outputPath);
    return outputPath;
  }
}

async function runPiper(text, outputPath) {
  const modelPath = process.env.PIPER_MODEL_PATH;
  if (!modelPath) {
    throw new Error('PIPER_MODEL_PATH is not configured.');
  }

  await runCommandWithInput('piper', ['--model', modelPath, '--output_file', outputPath], text);
}

async function runCoqui(text, outputPath) {
  const modelName = process.env.COQUI_MODEL_NAME || 'tts_models/en/ljspeech/tacotron2-DDC';

  await runCommand('tts', [
    '--text',
    text,
    '--model_name',
    modelName,
    '--out_path',
    outputPath
  ]);
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to start ${command}: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`${command} exited with code ${code}: ${stderr}`));
      }
      resolve();
    });
  });
}

function runCommandWithInput(command, args, inputText) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = '';

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to start ${command}: ${err.message}`));
    });

    proc.stdin.write(inputText);
    proc.stdin.end();

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`${command} exited with code ${code}: ${stderr}`));
      }
      resolve();
    });
  });
}

module.exports = {
  synthesizeSpeech
};
