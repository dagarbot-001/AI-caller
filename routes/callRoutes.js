const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { transcribeAudio } = require('../services/sttService');
const { generateSalesResponse } = require('../services/openaiService');
const { synthesizeSpeech } = require('../services/ttsService');

const router = express.Router();

// Configure upload storage for incoming Asterisk audio files.
const uploadDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '.wav') || '.wav';
    cb(null, `${Date.now()}-${uuidv4()}${extension}`);
  }
});

const upload = multer({ storage });

/**
 * POST /api/call/process
 * Accepts multipart/form-data with `audio` field.
 * Returns transcript, response text, and output audio URL.
 */
router.post('/process', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ error: 'No audio file uploaded. Use form field: audio' });
    }

    const transcript = await transcribeAudio(req.file.path);
    const salesReply = await generateSalesResponse(transcript);

    const outputFileName = `${path.parse(req.file.filename).name}-reply.wav`;
    const outputPath = await synthesizeSpeech(salesReply, outputFileName);

    return res.status(200).json({
      success: true,
      transcript,
      replyText: salesReply,
      outputAudioFile: outputPath,
      outputAudioUrl: `/audio/${outputFileName}`
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
