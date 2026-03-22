import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { HeroSection, AnalyzerSection, ResultsDashboard } from './components';
import type { AnalysisResult } from './types';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [editedResumeText, setEditedResumeText] = useState('');
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

      const analysisResult: AnalysisResult = await response.json();
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

  const handleApplyRecommendation = useCallback((recommendation: string) => {
    setEditedResumeText((currentText) => {
      const trimmedCurrent = currentText.trimEnd();

      if (!trimmedCurrent) {
        return recommendation;
      }

      if (trimmedCurrent.toLowerCase().includes(recommendation.toLowerCase())) {
        return currentText;
      }

      return `${trimmedCurrent}\n- ${recommendation}`;
    });
  }, []);

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
              <a href="#" className="hover:text-slate-900 transition">Design</a>
              <a href="#" className="hover:text-slate-900 transition">Photos</a>
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
