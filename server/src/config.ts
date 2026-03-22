import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const projectRootPath = path.resolve(currentDirPath, '..', '..');

export const serverConfig = {
  port: Number(process.env.PORT ?? '8787'),
  projectRootPath,
  dataDirectoryPath: path.join(projectRootPath, '.resume-data'),
  vectorIndexPath: path.join(projectRootPath, '.resume-data', 'vectra', 'resume-analysis'),
  maxUploadSizeBytes: 10 * 1024 * 1024,
  embeddingDimensions: 256,
  chunkSizeWords: 120,
  chunkOverlapWords: 30,
  vectorDebugLogging: process.env.VECTOR_DEBUG !== 'false',
  grokApiKey: process.env.GROK_API_KEY ?? '',
  grokModel: process.env.GROK_MODEL ?? 'grok-3-mini',
  grokBaseUrl: process.env.GROK_BASE_URL ?? 'https://api.x.ai/v1',
};