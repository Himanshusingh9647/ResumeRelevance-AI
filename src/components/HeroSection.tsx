import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Soft background shape */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[55rem] h-[55rem] bg-slate-100 rounded-full blur-[150px]" />
      </div>

      {/* Hero image (styled like the reference) */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
        <div className="relative w-[30rem] h-[40rem] max-w-[90vw]">
          <img
            src="https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?auto=format&fit=crop&w=1200&q=80"
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover rounded-[3rem] shadow-2xl shadow-slate-300/30 mix-blend-multiply"
          />
          <div className="absolute inset-0 rounded-[3rem] bg-white/90" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        <p className="text-sm text-slate-500 tracking-wide mb-6">👋 Hello, I’m ResumeRelevance — your AI-powered resume coach</p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-extrabold leading-[0.95] text-[5.5rem] sm:text-[7rem] md:text-[8.5rem] lg:text-[9.5rem] tracking-tight text-slate-900"
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
            className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-slate-200 bg-slate-900/95 text-white text-sm font-semibold shadow-lg shadow-slate-900/10 hover:bg-slate-900 transition"
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
