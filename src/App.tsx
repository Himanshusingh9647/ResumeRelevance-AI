import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { HeroSection, AnalyzerSection, ResultsDashboard } from './components';
import type { AnalysisResult, RecommendationItem, ResumeSection } from './types';

const sectionMatchers: Array<{ section: ResumeSection; patterns: RegExp[]; headingLabel: string }> = [
  { section: 'summary', headingLabel: 'Summary', patterns: [/^summary$/i, /^professional summary$/i, /^profile$/i] },
  { section: 'skills', headingLabel: 'Skills', patterns: [/^skills?$/i, /^technical skills?$/i, /^core skills?$/i] },
  { section: 'experience', headingLabel: 'Experience', patterns: [/^experience$/i, /^work experience$/i, /^professional experience$/i, /^employment history$/i] },
  { section: 'projects', headingLabel: 'Projects', patterns: [/^projects?$/i, /^personal projects?$/i] },
  { section: 'education', headingLabel: 'Education', patterns: [/^education$/i, /^academic background$/i] },
  { section: 'certifications', headingLabel: 'Certifications', patterns: [/^certifications?$/i, /^licenses$/i] },
  { section: 'other', headingLabel: 'Additional Information', patterns: [] },
];

function normalizeRecommendationSection(value: unknown): ResumeSection {
  if (typeof value !== 'string') {
    return 'other';
  }

  const normalized = value.trim().toLowerCase();

  if (
    normalized === 'summary' ||
    normalized === 'skills' ||
    normalized === 'experience' ||
    normalized === 'projects' ||
    normalized === 'education' ||
    normalized === 'certifications'
  ) {
    return normalized;
  }

  return 'other';
}

function inferSectionFromText(value: string): ResumeSection {
  const text = value.toLowerCase();

  if (/\b(skill|skills|technical)\b/.test(text)) return 'skills';
  if (/\b(experience|intern|work|professional)\b/.test(text)) return 'experience';
  if (/\b(project|built|developed)\b/.test(text)) return 'projects';
  if (/\b(summary|profile)\b/.test(text)) return 'summary';
  if (/\b(education|degree|university)\b/.test(text)) return 'education';
  if (/\b(certification|certificate|license)\b/.test(text)) return 'certifications';

  return 'other';
}

function normalizeRecommendationItem(input: unknown): RecommendationItem | null {
  if (typeof input === 'string') {
    const text = input.trim();
    if (!text) {
      return null;
    }

    return {
      section: inferSectionFromText(text),
      text,
    };
  }

  if (!input || typeof input !== 'object') {
    return null;
  }

  const candidate = input as { section?: unknown; text?: unknown };

  if (typeof candidate.text !== 'string') {
    return null;
  }

  const text = candidate.text.trim();

  if (!text) {
    return null;
  }

  return {
    section: normalizeRecommendationSection(candidate.section),
    text,
  };
}

function normalizeAnalysisResult(payload: unknown): AnalysisResult {
  const candidate = (payload && typeof payload === 'object' ? payload : {}) as Partial<AnalysisResult> & {
    recommendations?: unknown;
  };

  const recommendations = Array.isArray(candidate.recommendations)
    ? candidate.recommendations
      .map((entry) => normalizeRecommendationItem(entry))
      .filter((entry): entry is RecommendationItem => Boolean(entry))
    : [];

  return {
    matchScore: Number(candidate.matchScore ?? 0),
    matchedSkills: Array.isArray(candidate.matchedSkills) ? candidate.matchedSkills.filter((v): v is string => typeof v === 'string') : [],
    missingSkills: Array.isArray(candidate.missingSkills) ? candidate.missingSkills.filter((v): v is string => typeof v === 'string') : [],
    aiAdvice: typeof candidate.aiAdvice === 'string' ? candidate.aiAdvice : '',
    recommendations,
    resumeText: typeof candidate.resumeText === 'string' ? candidate.resumeText : '',
  };
}

function normalizeLineForMatch(line: string) {
  return line.replace(/[:\-]+$/g, '').trim().toLowerCase();
}

function isLineSectionHeading(line: string) {
  const normalized = normalizeLineForMatch(line);

  if (!normalized) {
    return false;
  }

  return sectionMatchers.some((entry) => entry.patterns.some((pattern) => pattern.test(normalized)));
}

function findSectionStartIndex(lines: string[], targetSection: ResumeSection) {
  const matcher = sectionMatchers.find((entry) => entry.section === targetSection);

  if (!matcher) {
    return -1;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const normalized = normalizeLineForMatch(lines[index]);

    if (matcher.patterns.some((pattern) => pattern.test(normalized))) {
      return index;
    }
  }

  return -1;
}

function findSectionEndIndex(lines: string[], sectionStartIndex: number) {
  for (let index = sectionStartIndex + 1; index < lines.length; index += 1) {
    if (isLineSectionHeading(lines[index])) {
      return index;
    }
  }

  return lines.length;
}

function insertRecommendationIntoSection(text: string, recommendation: RecommendationItem) {
  const cleanedRecommendation = recommendation.text?.trim();

  if (!cleanedRecommendation) {
    return text;
  }

  if (text.toLowerCase().includes(cleanedRecommendation.toLowerCase())) {
    return text;
  }

  const lines = text.split('\n');
  const targetStartIndex = findSectionStartIndex(lines, recommendation.section);

  if (targetStartIndex >= 0) {
    const sectionEndIndex = findSectionEndIndex(lines, targetStartIndex);
    lines.splice(sectionEndIndex, 0, `- ${cleanedRecommendation}`);
    return lines.join('\n').trimEnd();
  }

  const matcher = sectionMatchers.find((entry) => entry.section === recommendation.section) ?? sectionMatchers[sectionMatchers.length - 1];
  const trimmedText = text.trimEnd();

  return `${trimmedText}\n\n${matcher.headingLabel}\n- ${cleanedRecommendation}`.trim();
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [editedResumeText, setEditedResumeText] = useState('');
  const [showResumePhotos, setShowResumePhotos] = useState(false);
  const [resumePhotos, setResumePhotos] = useState<Array<{ id: string; title: string; thumbnailUrl: string; fullImageUrl: string }>>([]);
  const [resumePhotosLoading, setResumePhotosLoading] = useState(false);
  const [resumePhotosError, setResumePhotosError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = useCallback(async () => {
    if (!file || !jobDescription.trim()) return;

    setIsLoading(true);
    setResult(null);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDescription);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({ message: 'Unable to analyze the resume.' }));
        throw new Error(errorPayload.message ?? 'Unable to analyze the resume.');
      }

      const payload = await response.json();
      const analysisResult = normalizeAnalysisResult(payload);
      setResult(analysisResult);
      setEditedResumeText(analysisResult.resumeText);
    } catch (error) {
      console.error('Analysis failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [file, jobDescription]);

  const handleReset = useCallback(() => {
    setFile(null);
    setJobDescription('');
    setResult(null);
    setEditedResumeText('');
    setErrorMessage(null);
  }, []);

  const handleApplyRecommendation = useCallback((recommendation: RecommendationItem) => {
    setEditedResumeText((currentText) => {
      const baseText = currentText.trim().length > 0 ? currentText : result?.resumeText ?? '';
      return insertRecommendationIntoSection(baseText, recommendation);
    });
  }, [result?.resumeText]);

  const handleApplyAllRecommendations = useCallback(() => {
    if (!result?.recommendations?.length) {
      return;
    }

    setEditedResumeText((currentText) => {
      let nextText = currentText.trim().length > 0 ? currentText : result.resumeText;

      for (const recommendation of result.recommendations) {
        nextText = insertRecommendationIntoSection(nextText, recommendation);
      }

      return nextText;
    });
  }, [result]);

  useEffect(() => {
    if (!showResumePhotos || resumePhotos.length > 0 || resumePhotosLoading) {
      return;
    }

    const loadPhotos = async () => {
      setResumePhotosLoading(true);
      setResumePhotosError(null);

      try {
        const response = await fetch('/api/resume-photos');

        if (!response.ok) {
          throw new Error(`Unable to load resume photos: ${response.status}`);
        }

        const payload = await response.json();

        if (!payload?.photos || !Array.isArray(payload.photos)) {
          throw new Error('No resume images returned from server.');
        }

        setResumePhotos(payload.photos);
      } catch (error) {
        setResumePhotosError(error instanceof Error ? error.message : 'Unknown error loading resume photos.');
      } finally {
        setResumePhotosLoading(false);
      }
    };

    void loadPhotos();
  }, [showResumePhotos, resumePhotos.length, resumePhotosLoading]);

  const handleDownloadUpdatedResume = useCallback(() => {
    if (!editedResumeText.trim()) {
      return;
    }

    const baseName = file?.name?.replace(/\.pdf$/i, '') ?? 'updated-resume';
    const documentPdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const marginLeft = 48;
    const marginTop = 56;
    const pageWidth = documentPdf.internal.pageSize.getWidth();
    const pageHeight = documentPdf.internal.pageSize.getHeight();
    const maxTextWidth = pageWidth - (marginLeft * 2);
    const lineHeight = 18;

    documentPdf.setFont('helvetica', 'normal');
    documentPdf.setFontSize(11);

    let cursorY = marginTop;

    for (const paragraph of editedResumeText.split('\n')) {
      const safeLine = paragraph.trim().length === 0 ? ' ' : paragraph;
      const wrappedLines = documentPdf.splitTextToSize(safeLine, maxTextWidth) as string[];

      for (const wrappedLine of wrappedLines) {
        if (cursorY > pageHeight - marginTop) {
          documentPdf.addPage();
          cursorY = marginTop;
        }

        documentPdf.text(wrappedLine, marginLeft, cursorY);
        cursorY += lineHeight;
      }
    }

    documentPdf.save(`${baseName}-updated.pdf`);
  }, [editedResumeText, file]);

  return (
    <div ref={containerRef} className="min-h-screen bg-white text-slate-900 relative">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold tracking-tight">ResumeRelevance</span>
              <span className="hidden sm:inline text-sm text-slate-500">AI</span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
              <a href="#photos" className="hover:text-slate-900 transition">Photos</a>
              <a href="#" className="hover:text-slate-900 transition">About</a>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 border border-slate-200 rounded-full px-3 py-1">
                <span className="font-semibold">FR</span>
                <span className="font-semibold">EN</span>
              </div>
              <a
                href="mailto:hello@resume.relevance"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 transition"
              >
                hello@resume.relevance
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        {/* Hero Section */}
        <HeroSection />

        {/* Stats Section */}
        <div className="py-16 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { number: '10K+', label: 'Resumes Analyzed', icon: '📊', color: 'from-cyan-500 to-blue-500' },
                { number: '95%', label: 'User Satisfaction', icon: '⭐', color: 'from-blue-500 to-purple-500' },
                { number: '2.5s', label: 'Average Analysis Time', icon: '⚡', color: 'from-purple-500 to-pink-500' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="relative group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity`} />
                  <div className="relative bg-white shadow-sm border border-slate-200 rounded-2xl p-8 text-center hover:shadow-md transition-all">
                    <div className="text-4xl mb-3">{stat.icon}</div>
                    <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                      {stat.number}
                    </div>
                    <p className="text-slate-600 font-medium">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Resume Photos Section */}
        <section id="photos" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Resume Photos</h2>
                <p className="text-slate-600">Explore sample resume layouts and click a thumbnail to open it.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowResumePhotos((prev) => !prev)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
              >
                {showResumePhotos ? 'Hide Resume Photos' : 'Show Resume Photos'}
              </button>
            </div>

            {showResumePhotos && (
              <div>
                {resumePhotosLoading && (
                  <p className="text-sm text-slate-600 mb-4">Loading resume photos...</p>
                )}

                {resumePhotosError && (
                  <p className="text-sm text-red-600 mb-4">{resumePhotosError}</p>
                )}

                {!resumePhotosLoading && !resumePhotosError && resumePhotos.length === 0 && (
                  <p className="text-sm text-slate-600 mb-4">No resume photos are available.</p>
                )}

                {!resumePhotosLoading && !resumePhotosError && resumePhotos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {resumePhotos.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.fullImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group block rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition"
                      >
                        <img src={photo.thumbnailUrl} alt={photo.title} className="w-full h-auto" />
                        <div className="p-2 bg-white">
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">{photo.title}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Analyzer Section */}
        <div className="bg-slate-50 py-12">
          <AnalyzerSection
            file={file}
            jobDescription={jobDescription}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onFileUpload={setFile}
            onJobDescriptionChange={setJobDescription}
            onAnalyze={handleAnalyze}
          />
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-100 py-12 px-4 sm:px-6 lg:px-8"
            >
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Analysis Results</h2>
                    <p className="text-slate-500">Here's how your resume matches the job description</p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                  >
                    Start New Analysis
                  </button>
                </div>
                <ResultsDashboard
                  result={result}
                  editedResumeText={editedResumeText}
                  onEditedResumeTextChange={setEditedResumeText}
                  onApplyRecommendation={handleApplyRecommendation}
                  onApplyAllRecommendations={handleApplyAllRecommendations}
                  onDownloadUpdatedResume={handleDownloadUpdatedResume}
                />
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className={`${result ? 'bg-slate-50' : 'bg-white'} py-12 border-t ${result ? 'border-slate-200' : 'border-slate-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className={`font-semibold ${result ? 'text-slate-700' : 'text-slate-900'}`}>
                ResumeRelevance<span className="text-indigo-500">AI</span>
              </span>
            </div>
            <p className={`text-sm ${result ? 'text-slate-500' : 'text-slate-600'}`}>
              Powered by advanced AI to help you land your dream job.
            </p>
            <p className={`text-xs ${result ? 'text-slate-400' : 'text-slate-500'} mt-4`}>
              © 2026 ResumeRelevance AI. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
