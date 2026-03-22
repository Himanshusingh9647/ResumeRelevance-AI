import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { analyzeResume } from './resumeAnalysis.js';
import { serverConfig } from './config.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: serverConfig.maxUploadSizeBytes,
  },
});

const app = express();

const resumeImagesDir = path.join(process.cwd(), 'public', 'resume-images');
app.use('/resume-images', express.static(resumeImagesDir));

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

const resumeGraphics = [
  { id: '1', title: 'Professional Chronological', filename: 'resume-1.svg' },
  { id: '2', title: 'Modern Skill Focus', filename: 'resume-2.svg' },
  { id: '3', title: 'Simple Clean Format', filename: 'resume-3.svg' },
  { id: '4', title: 'Creative Template', filename: 'resume-4.svg' },
];

async function ensureResumeImages() {
  await mkdir(resumeImagesDir, { recursive: true });

  for (const image of resumeGraphics) {
    const imagePath = path.join(resumeImagesDir, image.filename);

    try {
      await stat(imagePath);
      continue;
    } catch {
      // missing file, create
    }

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1560" viewBox="0 0 1200 1560">\n  <rect width="1200" height="1560" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4" />\n  <text x="50" y="120" font-family="Inter, Arial, sans-serif" font-size="56" font-weight="700" fill="#0f172a">${image.title}</text>\n  <text x="50" y="220" font-family="Inter, Arial, sans-serif" font-size="32" fill="#475569">Summary: AI-optimized resume text sections with strong keywords.</text>\n  <rect x="50" y="280" width="1100" height="120" fill="#e2e8f0" rx="12" />\n  <text x="70" y="340" font-family="Inter, Arial, sans-serif" font-size="26" fill="#0f172a">• Experienced in modern ATS-friendly formatting</text>\n  <rect x="50" y="430" width="1100" height="940" fill="#fff" stroke="#cbd5e1" stroke-width="2" rx="14" />\n  <text x="70" y="470" font-family="Inter, Arial, sans-serif" font-size="28" fill="#334155">Experience</text>\n  <text x="70" y="520" font-family="Inter, Arial, sans-serif" font-size="22" fill="#475569">- Built scalable applications using Node.js and React.</text>\n  <text x="70" y="560" font-family="Inter, Arial, sans-serif" font-size="22" fill="#475569">- Improved resume matching by 32% with keyword tuning.</text>\n</svg>`;

    await writeFile(imagePath, svgContent, 'utf8');
  }
}

app.get('/api/resume-photos', async (_request, response) => {
  try {
    await ensureResumeImages();

    response.json({
      photos: resumeGraphics.map((entry) => ({
        id: entry.id,
        title: entry.title,
        thumbnailUrl: `/resume-images/${entry.filename}`,
        fullImageUrl: `/resume-images/${entry.filename}`,
      })),
    });
  } catch (error) {
    console.error('Error preparing resume images:', error);
    response.status(500).json({ message: 'Failed to load resume images.' });
  }
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