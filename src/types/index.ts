export interface AnalysisResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  aiAdvice: string;
  recommendations: string[];
  resumeText: string;
}

export interface FileUploadState {
  file: File | null;
  fileName: string;
  isDragging: boolean;
}
