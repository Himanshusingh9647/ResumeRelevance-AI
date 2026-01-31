import { motion, type Variants } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { CircularProgress } from './CircularProgress';
import { cn } from '../lib/utils';
import type { AnalysisResult } from '../types';

interface ResultsDashboardProps {
  result: AnalysisResult;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export function ResultsDashboard({ result }: ResultsDashboardProps) {
  const { matchScore, matchedSkills, missingSkills, aiAdvice } = result;
  
  const getScoreLabel = () => {
    if (matchScore >= 85) return { text: 'Excellent Match!', color: 'text-teal-600' };
    if (matchScore >= 75) return { text: 'Strong Match', color: 'text-teal-600' };
    if (matchScore >= 60) return { text: 'Good Match', color: 'text-amber-600' };
    if (matchScore >= 40) return { text: 'Partial Match', color: 'text-amber-600' };
    return { text: 'Needs Improvement', color: 'text-red-600' };
  };

  const scoreLabel = getScoreLabel();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Score Section */}
      <motion.div
        variants={itemVariants}
        className="glass-card gradient-border soft-shadow rounded-2xl p-8 border border-slate-100"
      >
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Circular Progress */}
          <div className="flex-shrink-0">
            <CircularProgress value={matchScore} size={180} strokeWidth={14} />
          </div>
          
          {/* Score Details */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h2 className={cn("text-2xl font-bold mb-2", scoreLabel.color)}>
                {scoreLabel.text}
              </h2>
              <p className="text-slate-600 mb-4">
                Your resume matches <span className="font-semibold">{matchScore}%</span> of the job requirements
              </p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-700">
                    {matchedSkills.length} skills matched
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">
                    {missingSkills.length} skills to add
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matched Skills */}
        <motion.div
          variants={itemVariants}
          className="glass-card rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Matched Skills</h3>
              <p className="text-xs text-slate-500">Found in your resume</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {matchedSkills.length > 0 ? (
              matchedSkills.map((skill, index) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-sm font-medium text-teal-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {skill}
                </motion.span>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">No matching skills found</p>
            )}
          </div>
        </motion.div>

        {/* Missing Skills */}
        <motion.div
          variants={itemVariants}
          className="glass-card rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Missing Skills</h3>
              <p className="text-xs text-slate-500">Consider adding these</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill, index) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {skill}
                </motion.span>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">All required skills found!</p>
            )}
          </div>
        </motion.div>

        {/* AI Advice */}
        <motion.div
          variants={itemVariants}
          className="glass-card rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 lg:col-span-1"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">AI Recommendations</h3>
              <p className="text-xs text-slate-500">Personalized advice</p>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 rounded-xl blur-sm" />
            <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-sm text-slate-700 leading-relaxed">
                {aiAdvice}
              </p>
            </div>
          </div>
          
          {/* Action hint */}
          <div className="mt-4 flex items-center gap-2 text-xs text-indigo-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Apply these changes to improve your score</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
