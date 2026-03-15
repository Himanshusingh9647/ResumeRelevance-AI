import { motion } from 'framer-motion';
import { Sparkles, FileSearch, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

export function HeroSection() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Animated Background Gradient Mesh */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950" />
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-[128px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[128px] animate-float" style={{ animationDelay: '-3s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-1.5s' }} />
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-2s' }} />
        </div>
        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 border border-cyan-400/50"
        >
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity }}>
            <Sparkles className="w-4 h-4 text-cyan-300" />
          </motion.div>
          <span className="text-sm font-medium bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent">⚡ AI-Powered Resume Analysis</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight"
        >
          Optimize Your Resume for the{' '}
          <span className="relative">
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-pink-400 bg-clip-text text-transparent animate-shimmer">
              Perfect Role
            </span>
            <motion.span
              className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10"
        >
          AI-powered semantic gap analysis to help you beat the ATS and land your dream job.
        </motion.p>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {[
            { icon: FileSearch, text: 'Smart Skill Matching', color: 'from-cyan-400 to-blue-500' },
            { icon: Zap, text: 'Instant Analysis', color: 'from-blue-400 to-purple-500' },
            { icon: Sparkles, text: 'AI Recommendations', color: 'from-pink-400 to-rose-500' },
          ].map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.08, y: -5 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 border border-white/20 text-slate-300 cursor-pointer hover:border-white/40 backdrop-blur-sm group"
            >
              <div className={`bg-gradient-to-r ${feature.color} p-1.5 rounded-lg`}>
                <feature.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold group-hover:text-white transition-colors">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#analyzer"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-pink-500 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all hover:-translate-y-0.5"
          >
            Start Free Analysis
          </a>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isScrolled ? 0 : 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden"
      >
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-slate-300 font-semibold tracking-widest uppercase">Scroll to explore</p>
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-7 h-11 rounded-full border-2 border-cyan-400/50 flex items-start justify-center p-2 hover:border-cyan-400 transition-all cursor-pointer group"
          >
            <motion.div 
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-2.5 bg-gradient-to-b from-cyan-400 to-pink-400 rounded-full group-hover:shadow-lg group-hover:shadow-cyan-400/50" 
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
