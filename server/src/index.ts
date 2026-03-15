import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { mkdir } from 'node:fs/promises';
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
    mode: 'scaffold',
  });
});

app.post('/api/analyze', upload.single('resume'), async (request, response) => {
  const jobDescription = typeof request.body.jobDescription === 'string'
    ? request.body.jobDescription.trim()
    : '';

  if (!request.file) {
    response.status(400).json({ message: 'Resume PDF is required.' });
    return;
  }

  if (!jobDescription) {
    response.status(400).json({ message: 'Job description is required.' });
    return;
  }

  response.status(501).json({
    message: 'Backend scaffold is ready. Vector analysis will be added in the next step.',
  });
});

app.listen(serverConfig.port, () => {
  console.log(`ResumeRelevance AI backend listening on port ${serverConfig.port}`);
});