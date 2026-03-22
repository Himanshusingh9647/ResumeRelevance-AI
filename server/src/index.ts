import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { mkdir } from 'node:fs/promises';
import { analyzeResume } from './resumeAnalysis.js';
import { serverConfig } from './config.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: serverConfig.maxUploadSizeBytes,
  },
});

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_request, response) => {
  await mkdir(serverConfig.dataDirectoryPath, { recursive: true });

  response.json({
    status: 'ok',
    vectorStore: 'vectra',
    mode: 'vector-analysis',
  });
});

app.post('/api/analyze', upload.single('resume'), async (request, response) => {
  try {
    const jobDescription = typeof request.body.jobDescription === 'string'
      ? request.body.jobDescription.trim()
      : '';

    if (!request.file) {
      response.status(400).json({ message: 'Resume PDF is required.' });
      return;
    }

    if (request.file.mimetype !== 'application/pdf') {
      response.status(400).json({ message: 'Only PDF resumes are supported right now.' });
      return;
    }

    if (!jobDescription) {
      response.status(400).json({ message: 'Job description is required.' });
      return;
    }

    const analysisResult = await analyzeResume({
      resumeBuffer: request.file.buffer,
      jobDescription,
      fileName: request.file.originalname,
    });

    response.json(analysisResult);
  } catch (error) {
    console.error('Resume analysis failed.', error);

    response.status(500).json({
      message: error instanceof Error ? error.message : 'Resume analysis failed.',
    });
  }
});

app.listen(serverConfig.port, () => {
  console.log(`ResumeRelevance AI backend listening on port ${serverConfig.port}`);
});