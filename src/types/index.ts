export type ResumeSection = 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'other';

export interface RecommendationItem {
  section: ResumeSection;
  text: string;
}

export interface AnalysisResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  aiAdvice: string;
  recommendations: RecommendationItem[];
  resumeText: string;
}

export interface FileUploadState {
  file: File | null;
  fileName: string;
  isDragging: boolean;
}
