export interface AnalysisResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  aiAdvice: string;
}

export interface FileUploadState {
  file: File | null;
  fileName: string;
  isDragging: boolean;
}
