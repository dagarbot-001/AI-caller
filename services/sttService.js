const { spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

/**
 * Transcribe an audio file using local Whisper CLI.
 * Requires `whisper` command in PATH.
 * @param {string} inputAudioPath - Path to caller audio file.
 * @returns {Promise<string>} Transcript text.
 */
async function transcribeAudio(inputAudioPath) {
  const tempDir = path.join(__dirname, '..', 'output', 'whisper-temp');
  await fs.mkdir(tempDir, { recursive: true });

  // Whisper writes txt file named after audio stem.
  const fileStem = path.parse(inputAudioPath).name;
  const outputTxtPath = path.join(tempDir, `${fileStem}.txt`);

  await runCommand('whisper', [
    inputAudioPath,
    '--model',
    process.env.WHISPER_MODEL || 'base',
    '--language',
    process.env.WHISPER_LANGUAGE || 'en',
    '--task',
    'transcribe',
    '--output_format',
    'txt',
    '--output_dir',
    tempDir
  ]);

  const transcript = (await fs.readFile(outputTxtPath, 'utf8')).trim();
  if (!transcript) {
    throw new Error('Whisper generated an empty transcript.');
  }

  return transcript;
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

module.exports = {
  transcribeAudio
};
