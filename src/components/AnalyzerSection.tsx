import { motion } from 'framer-motion';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { ResumeUpload } from './ResumeUpload';
import { JobDescriptionInput } from './JobDescriptionInput';
import { cn } from '../lib/utils';

interface AnalyzerSectionProps {
  file: File | null;
  jobDescription: string;
  isLoading: boolean;
  errorMessage?: string | null;
  onFileUpload: (file: File | null) => void;
  onJobDescriptionChange: (value: string) => void;
  onAnalyze: () => void;
}

export function AnalyzerSection({
  file,
  jobDescription,
  isLoading,
  errorMessage,
  onFileUpload,
  onJobDescriptionChange,
  onAnalyze,
}: AnalyzerSectionProps) {
  const canAnalyze = file && jobDescription.trim().length > 50;

  return (
    <section id="analyzer" className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="gradient-border soft-shadow"
        >
          <div className="rounded-[24px] bg-white/95 backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 px-6 sm:px-8 py-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Resume Analyzer</h2>
                  <p className="text-sm text-slate-500">Upload your resume and paste the job description</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Left: Resume Upload */}
                <ResumeUpload file={file} onFileUpload={onFileUpload} />

                {/* Right: Job Description */}
                <JobDescriptionInput
                  value={jobDescription}
                  onChange={onJobDescriptionChange}
                />
              </div>

              {/* Analyze Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                {errorMessage ? (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  onClick={onAnalyze}
                  disabled={!canAnalyze || isLoading}
                  className={cn(
                    "w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300",
                    "flex items-center justify-center gap-3",
                    "focus:outline-none focus:ring-4 focus:ring-indigo-500/20",
                    canAnalyze && !isLoading
                      ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing your resume...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Analyze Match
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Helper text */}
                {!canAnalyze && !isLoading && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-slate-400 mt-3"
                  >
                    {!file && !jobDescription
                      ? "Upload a resume and paste a job description to begin"
                      : !file
                      ? "Please upload your resume"
                      : "Please paste a job description (at least 50 characters)"}
                  </motion.p>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
