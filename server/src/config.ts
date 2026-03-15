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
};