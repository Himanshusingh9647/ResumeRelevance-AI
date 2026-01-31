import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Twitter, Sparkles } from 'lucide-react';
import { HeroSection, AnalyzerSection, ResultsDashboard } from './components';
import type { AnalysisResult } from './types';

// Simulated AI analysis - in production, this would call your backend API
const simulateAnalysis = async (file: File, jobDescription: string): Promise<AnalysisResult> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Extract some keywords from job description for demo purposes
  const jdLower = jobDescription.toLowerCase();
  
  // Common tech skills to check for
  const allSkills = [
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Docker',
    'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Git', 'REST API',
    'GraphQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Agile', 'Scrum',
    'TDD', 'Microservices', 'System Design', 'Leadership', 'Communication'
  ];

  // Randomly determine which skills are "matched" and which are "missing"
  // In a real app, this would be done by your AI/ML backend
  const shuffled = [...allSkills].sort(() => Math.random() - 0.5);
  const matchedCount = Math.floor(Math.random() * 8) + 5; // 5-12 matched skills
  const missingCount = Math.floor(Math.random() * 5) + 2; // 2-6 missing skills
  
  const matchedSkills = shuffled.slice(0, matchedCount);
  const missingSkills = shuffled.slice(matchedCount, matchedCount + missingCount);
  
  // Calculate score based on matched vs total
  const totalSkillsInJD = matchedCount + missingCount;
  const matchScore = Math.round((matchedCount / totalSkillsInJD) * 100);
  
  // Generate contextual AI advice
  const adviceOptions = [
    `Your resume shows strong alignment with ${matchedCount} key requirements. To improve your match score, consider adding specific examples of ${missingSkills.slice(0, 2).join(' and ')} experience. Quantify your achievements where possible.`,
    `Great foundation! Focus on highlighting your ${matchedSkills.slice(0, 2).join(' and ')} experience more prominently. Add keywords like "${missingSkills[0]}" to your skills section to pass ATS filters.`,
    `You're ${matchScore}% aligned with this role. The job emphasizes ${missingSkills[0]} - consider adding a project or certification that demonstrates this skill. Your ${matchedSkills[0]} experience is a strong point.`,
  ];
  
  return {
    matchScore,
    matchedSkills,
    missingSkills,
    aiAdvice: adviceOptions[Math.floor(Math.random() * adviceOptions.length)],
  };
};

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = useCallback(async () => {
    if (!file || !jobDescription.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const analysisResult = await simulateAnalysis(file, jobDescription);
      setResult(analysisResult);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [file, jobDescription]);

  const handleReset = useCallback(() => {
    setFile(null);
    setJobDescription('');
    setResult(null);
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none aurora-bg">
        <div className="absolute top-0 right-0 w-[32rem] h-[32rem] bg-cyan-400 rounded-full blur-[140px] opacity-15 animate-float" />
        <div className="absolute bottom-0 left-0 w-[28rem] h-[28rem] bg-pink-500 rounded-full blur-[140px] opacity-15 animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute -top-24 left-1/3 w-[20rem] h-[20rem] bg-indigo-500 rounded-full blur-[120px] opacity-10 animate-float" style={{ animationDelay: '-1s' }} />
        <div className="noise-overlay" />
      </div>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-400/30 ring-1 ring-white/10">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">ResumeRelevance<span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">AI</span></span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-slate-400 hover:text-cyan-400 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-cyan-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
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
                  <div className="relative bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center hover:border-white/20 transition-all">
                    <div className="text-4xl mb-3">{stat.icon}</div>
                    <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                      {stat.number}
                    </div>
                    <p className="text-slate-400 font-medium">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Analyzer Section */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-12">
          <AnalyzerSection
            file={file}
            jobDescription={jobDescription}
            isLoading={isLoading}
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
                <ResultsDashboard result={result} />
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className={`${result ? 'bg-slate-100' : 'bg-slate-900'} py-12 border-t ${result ? 'border-slate-200' : 'border-white/10'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className={`font-semibold ${result ? 'text-slate-700' : 'text-white'}`}>
                ResumeRelevance<span className="text-indigo-500">AI</span>
              </span>
            </div>
            <p className={`text-sm ${result ? 'text-slate-500' : 'text-slate-400'}`}>
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
