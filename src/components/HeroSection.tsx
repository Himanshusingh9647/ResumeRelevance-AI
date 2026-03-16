import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Soft background shape */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[55rem] h-[55rem] bg-slate-100 rounded-full blur-[150px]" />
      </div>

      {/* Decorative floating shapes */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-100/70 rounded-full blur-3xl" />
        <div className="absolute top-24 right-16 w-72 h-72 bg-indigo-100/70 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-100/70 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),rgba(255,255,255,0))]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        <div className="mx-auto max-w-3xl bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl px-10 py-10 shadow-xl shadow-slate-200/50">
        <p className="text-sm text-slate-500 tracking-wide mb-6">👋 Hello, I’m ResumeRelevance — your AI-powered resume coach</p>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-extrabold leading-[0.95] text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-slate-900"
        >
          <span className="block">Resume</span>
          <span className="block outline-text">Relevance</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-600"
        >
          Analyze your resume against any job description. Get clear feedback and recommendations so you land the right role faster.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#analyzer"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-slate-200 bg-slate-900/95 text-white text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-900 transition"
          >
            You need a resume review
          </a>
          <a
            href="#analyzer"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-slate-200 bg-white text-slate-900 text-sm font-semibold shadow-sm hover:shadow-md transition"
          >
            You need an ATS boost
          </a>
        </motion.div>
      </div>
    </section>
  );
}
